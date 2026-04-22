import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import {
  AtSign,
  Brain,
  ChevronDown,
  Cpu,
  FileText,
  GitBranch,
  Loader2,
  Paperclip,
  Plus,
  Send,
  Slash,
  Sparkles,
  StopCircle,
  Terminal,
} from 'lucide-react';
import { useSessions, useSessionMessages, useConfig } from '@/api/hooks';
import type { SessionListItem, SessionMessage } from '@/api/types';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';
import { formatRelativeTime } from '@/lib/utils';
import { platformMeta } from '@/lib/platforms';
import { streamChat, HERMES_CHAT_MODEL } from '@/lib/hermesChat';

/**
 * Chat page — the `Talk` surface. Two-pane layout:
 *
 *   - Left rail: merged list of local (client-memory) chats + real Hermes sessions.
 *   - Right pane: message stream + composer.
 *
 * New conversations stream live from Hermes' OpenAI-compatible adapter on
 * port 8642 (`/v1/chat/completions`). Each turn sends the full in-memory
 * history — the adapter is stateless, so nothing is persisted server-side
 * across turns. Real Hermes sessions are rendered read-only (the adapter
 * does not append to them).
 */

interface LocalMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool' | 'subagent';
  textEn?: string;
  textZh?: string;
  /** True while the assistant content is still streaming in. */
  streaming?: boolean;
  // Tool-only
  name?: string;
  args?: string;
  out?: string;
  // Subagent-only
  status?: 'running' | 'done' | 'failed';
}

interface LocalSession {
  id: string;
  titleEn: string;
  titleZh: string;
  updatedAt: number; // ms
  model: string;
  messages: LocalMessage[];
  isNew?: boolean;
  /**
   * The Hermes-side session id bound to this client row. Populated when the
   * adapter echoes `X-Hermes-Session-Id` on the first response, or seeded
   * when the user opens an existing real session and continues it.
   * Subsequent sends include this via `X-Hermes-Session-Id` so Hermes
   * appends to the same server-side session instead of creating new ones.
   */
  hermesSessionId?: string;
}

function initialLocalSessions(): LocalSession[] {
  // Seed a single "new chat" placeholder so the empty state has something to
  // anchor on. Real Hermes sessions are layered on top at render time.
  return [
    {
      id: 'local-new',
      titleEn: 'New conversation',
      titleZh: '新对话',
      updatedAt: Date.now(),
      model: HERMES_CHAT_MODEL,
      messages: [],
      isNew: true,
    },
  ];
}

const SUGGESTIONS: ReadonlyArray<{
  icon: typeof Sparkles;
  en: string;
  zh: string;
}> = [
  {
    icon: Sparkles,
    en: 'Draft a new skill from my recent PRs',
    zh: '基于最近的 PR 起草一个新技能',
  },
  { icon: FileText, en: 'Summarize what I did this week', zh: '总结我这周做了什么' },
  { icon: Brain, en: 'What do you remember about me?', zh: '你对我还记得什么?' },
  {
    icon: Terminal,
    en: 'SSH into prod and check disk usage',
    zh: 'SSH 到生产环境检查磁盘使用',
  },
];

export function ChatPage() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const pushToast = useToastStore((s) => s.push);

  const sessionsQ = useSessions({ limit: 30 });
  const configQ = useConfig();
  const serverModel =
    configQ.data && typeof configQ.data.model === 'string'
      ? configQ.data.model
      : null;

  const [localSessions, setLocalSessions] = useState<LocalSession[]>(
    initialLocalSessions,
  );
  const [selectedId, setSelectedId] = useState<string>('local-new');
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derived: is the selected entry a mock local session or a real Hermes one?
  const isLocal = selectedId.startsWith('local-');
  const selectedLocal = useMemo(
    () => localSessions.find((s) => s.id === selectedId),
    [localSessions, selectedId],
  );
  const realId = isLocal ? null : selectedId;

  const realMessagesQ = useSessionMessages(realId);
  const realMessages = useMemo(
    () => realMessagesQ.data?.messages ?? [],
    [realMessagesQ.data],
  );

  const displayModel = serverModel ?? HERMES_CHAT_MODEL;

  // Auto-scroll to bottom when messages change.
  const realMsgCount = realMessages.length;
  const localMsgCount = selectedLocal?.messages.length ?? 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedId, realMsgCount, localMsgCount, streaming]);

  // Abort any in-flight stream if the user navigates away.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  // On session switch, just reset the visible streaming flag — do NOT abort
  // the in-flight fetch. Continuing a real session works by seeding a shadow
  // local session and calling setSelectedId, which would otherwise cancel our
  // own just-issued request. The delta / finalize closures bind to the
  // original session id, so a stream that ends after the user navigates away
  // still writes to the correct session and becomes visible if they return.
  useEffect(() => {
    setStreaming(false);
  }, [selectedId]);

  const handleNew = useCallback(() => {
    const id = `local-${Date.now()}`;
    const s: LocalSession = {
      id,
      titleEn: 'New conversation',
      titleZh: '新对话',
      updatedAt: Date.now(),
      model: HERMES_CHAT_MODEL,
      messages: [],
      isNew: true,
    };
    setLocalSessions((ss) => [s, ...ss]);
    setSelectedId(id);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  // Cmd+K / Ctrl+K starts a new chat.
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleNew();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNew]);

  // Close model menu on outside click.
  useEffect(() => {
    if (!modelMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (!modelRef.current?.contains(e.target as Node)) setModelMenuOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [modelMenuOpen]);

  function handleStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }

  function handleSend() {
    if (!input.trim() || streaming) return;

    let session = selectedLocal;

    // Continuing a real Hermes session: synthesize a local shadow bound to
    // the server session id, seeding it with the messages we already loaded
    // via useSessionMessages(). Subsequent sends go through the same code
    // path as native local chats, but each request carries
    // `X-Hermes-Session-Id` so Hermes appends to the same session.
    if (!session && !isLocal && realId) {
      const seedMessages: LocalMessage[] = realMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m, i): LocalMessage => ({
          id: i + 1,
          role: m.role === 'user' ? 'user' : 'assistant',
          textEn: typeof m.content === 'string' ? m.content : '',
          textZh: typeof m.content === 'string' ? m.content : '',
        }));
      const shadowId = `local-shadow-${realId}`;
      const realMeta = realSessions.find((s) => s.id === realId);
      const title = realMeta?.title || realMeta?.preview || tr('Conversation', '对话');
      session = {
        id: shadowId,
        titleEn: title,
        titleZh: title,
        updatedAt: Date.now(),
        model: HERMES_CHAT_MODEL,
        messages: seedMessages,
        hermesSessionId: realId,
      };
      setLocalSessions((ss) => (ss.some((s) => s.id === shadowId) ? ss : [session as LocalSession, ...ss]));
      setSelectedId(shadowId);
    }

    if (!session) return;
    // Pin the narrowed session so closures (appendDelta / finalize / onSessionId)
    // can reference it without TypeScript losing the non-null flow narrowing.
    const activeSession: LocalSession = session;
    const currentSessionId = activeSession.id;
    const text = input.trim();
    setInput('');

    const baseMessages = activeSession.messages;
    const nextUserId = (baseMessages.at(-1)?.id ?? 0) + 1;
    const nextAssistantId = nextUserId + 1;

    const userMsg: LocalMessage = {
      id: nextUserId,
      role: 'user',
      textEn: text,
      textZh: text,
    };
    const assistantPlaceholder: LocalMessage = {
      id: nextAssistantId,
      role: 'assistant',
      textEn: '',
      textZh: '',
      streaming: true,
    };

    // Build the wire payload BEFORE mutating state — we want the user's new
    // turn plus any prior 'user' / 'assistant' entries, ignoring tool/subagent
    // visualisation rows that the 8642 adapter does not understand.
    const history = baseMessages
      .filter(
        (m): m is LocalMessage & { role: 'user' | 'assistant' } =>
          m.role === 'user' || m.role === 'assistant',
      )
      .map((m) => ({
        role: m.role,
        content: (m.textEn ?? m.textZh ?? '').trim(),
      }))
      .filter((m) => m.content.length > 0);
    const wireMessages = [...history, { role: 'user' as const, content: text }];

    setLocalSessions((ss) =>
      ss.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg, assistantPlaceholder],
              titleEn: s.isNew ? text.slice(0, 40) : s.titleEn,
              titleZh: s.isNew ? text.slice(0, 40) : s.titleZh,
              isNew: false,
              updatedAt: Date.now(),
            }
          : s,
      ),
    );
    setStreaming(true);

    // Abort any stale in-flight request (should be rare, defensively).
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const appendDelta = (chunk: string) => {
      setLocalSessions((ss) =>
        ss.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === nextAssistantId
                    ? {
                        ...m,
                        textEn: (m.textEn ?? '') + chunk,
                        textZh: (m.textZh ?? '') + chunk,
                      }
                    : m,
                ),
              }
            : s,
        ),
      );
    };

    const finalize = () => {
      setLocalSessions((ss) =>
        ss.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === nextAssistantId ? { ...m, streaming: false } : m,
                ),
              }
            : s,
        ),
      );
      setStreaming(false);
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    };

    void streamChat({
      messages: wireMessages,
      signal: controller.signal,
      ...(activeSession.hermesSessionId ? { sessionId: activeSession.hermesSessionId } : {}),
      onSessionId: (id) => {
        // First turn of a brand-new chat: bind the adapter-assigned session id
        // so the next send continues on the same server-side session.
        setLocalSessions((ss) =>
          ss.map((s) =>
            s.id === currentSessionId && !s.hermesSessionId
              ? { ...s, hermesSessionId: id }
              : s,
          ),
        );
      },
      onDelta: (t) => appendDelta(t),
      onDone: (usage) => {
        finalize();
        if (usage.total_tokens > 0) {
          pushToast({
            level: 'info',
            titleEn: `${usage.total_tokens} tokens (${usage.prompt_tokens} in / ${usage.completion_tokens} out)`,
            titleZh: `${usage.total_tokens} tokens (输入 ${usage.prompt_tokens} / 输出 ${usage.completion_tokens})`,
            durationMs: 2500,
          });
        }
      },
      onError: (err) => {
        // AbortError is user-initiated (Stop button / session switch) — no toast.
        const isAbort =
          err.name === 'AbortError' ||
          /aborted/i.test(err.message);
        if (!isAbort) {
          pushToast({
            level: 'error',
            titleEn: 'Chat failed',
            titleZh: '对话失败',
            descEn: err.message,
            descZh: err.message,
          });
          // Surface the error inline in the assistant bubble so the failure
          // is visible even if the toast has been dismissed.
          setLocalSessions((ss) =>
            ss.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === nextAssistantId
                        ? {
                            ...m,
                            textEn:
                              (m.textEn ?? '') +
                              (m.textEn ? '\n\n' : '') +
                              `⚠ ${err.message}`,
                            textZh:
                              (m.textZh ?? '') +
                              (m.textZh ? '\n\n' : '') +
                              `⚠ ${err.message}`,
                          }
                        : m,
                    ),
                  }
                : s,
            ),
          );
        }
        finalize();
      },
    });
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleOpenModelMenu() {
    // The 8642 adapter only understands the server's configured model;
    // clicking the menu surfaces that fact rather than opening a chooser.
    setModelMenuOpen((v) => !v);
  }

  const realSessions: SessionListItem[] = sessionsQ.data?.sessions ?? [];

  // Merge: local-new + local-user sessions on top; real below.
  const mergedList = [
    ...localSessions.map((s) => ({
      kind: 'local' as const,
      id: s.id,
      titleEn: s.titleEn,
      titleZh: s.titleZh,
      updatedAt: s.updatedAt / 1000,
      model: s.model,
      msgCount: s.messages.length,
    })),
    ...realSessions.map((s) => ({
      kind: 'real' as const,
      id: s.id,
      titleEn: s.title || s.preview || '(untitled)',
      titleZh: s.title || s.preview || '(未命名)',
      updatedAt: s.last_active,
      model: s.model,
      msgCount: s.message_count,
      source: s.source,
    })),
  ];

  const emptyInput = input.trim().length === 0;
  // Composer is never disabled now — sending from a real Hermes session
  // synthesizes a local shadow bound to that session id (see handleSend).
  const composerDisabled = false;
  const placeholder = tr(
    'Message Hermes (Enter to send)',
    '给 Hermes 发消息(回车发送)',
  );

  return (
    <div
      style={{
        display: 'flex',
        height: '100%',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
      }}
    >
      {/* Left: session list */}
      <aside
        style={{
          width: 280,
          flexShrink: 0,
          borderRight: '1px solid var(--border-default)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 'var(--space-3) var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={handleNew}
            title={tr('New conversation (⌘K)', '新对话(⌘K)')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            <Plus size={14} aria-hidden="true" />
            <span>{tr('New', '新建')}</span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-muted)',
              }}
            >
              ⌘K
            </span>
          </button>
        </div>
        <nav
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
          aria-label={tr('Chat sessions', '聊天会话')}
        >
          {mergedList.map((item) => {
            const selected = item.id === selectedId;
            const Icon =
              item.kind === 'real'
                ? platformMeta((item as { source: string }).source).icon
                : Sparkles;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-pressed={selected}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--space-2)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid transparent',
                  background: selected ? 'var(--bg-tertiary)' : 'transparent',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  width: '100%',
                  minWidth: 0,
                }}
              >
                <Icon
                  size={12}
                  aria-hidden="true"
                  style={{
                    color: 'var(--text-muted)',
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {lang === 'zh' ? item.titleZh : item.titleEn}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatRelativeTime(item.updatedAt, lang)} · {item.msgCount}{' '}
                    {tr('msgs', '条')}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Right: composer + messages */}
      <section
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px var(--space-5)',
            borderBottom: '1px solid var(--border-default)',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, minWidth: 0 }}>
            {isLocal
              ? lang === 'zh'
                ? selectedLocal?.titleZh
                : selectedLocal?.titleEn
              : realSessions.find((s) => s.id === selectedId)?.title ||
                tr('Session', '会话')}
          </div>
          <div ref={modelRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={handleOpenModelMenu}
              aria-haspopup="menu"
              aria-expanded={modelMenuOpen}
              title={tr(
                'Server-configured model (read-only)',
                '服务端配置的模型(只读)',
              )}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
            >
              <Cpu size={12} aria-hidden="true" />
              <span>{displayModel}</span>
              <ChevronDown size={12} aria-hidden="true" />
            </button>
            {modelMenuOpen ? (
              <div
                role="menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 4,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  minWidth: 240,
                  boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
                  overflow: 'hidden',
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    padding: '8px 10px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {displayModel}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {tr('Current server model', '当前服务端模型')}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setModelMenuOpen(false);
                    pushToast({
                      level: 'info',
                      titleEn: 'Edit config.yaml to change the model',
                      titleZh: '修改 config.yaml 以切换模型',
                      descEn:
                        'The chat adapter uses the model configured on the server.',
                      descZh: '聊天适配器使用服务端配置的模型。',
                    });
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                  }}
                >
                  {tr('How do I change this?', '如何修改?')}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-5) var(--space-6)',
          }}
        >
          {isLocal ? (
            selectedLocal && selectedLocal.messages.length === 0 ? (
              <EmptyChat
                onPickSuggestion={(text) => {
                  setInput(text);
                  inputRef.current?.focus();
                }}
              />
            ) : (
              <div style={{ maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
                {selectedLocal?.messages.map((m) =>
                  renderLocalMessage(m, lang),
                )}
              </div>
            )
          ) : realMessagesQ.isPending ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <Loader2
                size={14}
                aria-hidden="true"
                className="animate-spin"
                style={{ marginRight: 6 }}
              />
              {tr('Loading messages…', '加载消息…')}
            </div>
          ) : realMessagesQ.isError ? (
            <div
              style={{
                padding: 'var(--space-4)',
                color: 'var(--danger)',
                fontSize: 'var(--text-xs)',
              }}
            >
              {tr('Failed to load messages.', '加载消息失败。')}
            </div>
          ) : realMessages.length === 0 ? (
            <div
              style={{
                color: 'var(--text-muted)',
                fontSize: 'var(--text-sm)',
              }}
            >
              {tr('No messages yet.', '暂无消息。')}
            </div>
          ) : (
            <div
              style={{
                maxWidth: 720,
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              {realMessages.map((m) => renderApiMessage(m, lang))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div
          style={{
            padding: 'var(--space-3) var(--space-6) var(--space-5)',
            borderTop: '1px solid var(--border-default)',
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: '0 auto',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              opacity: composerDisabled ? 0.7 : 1,
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={2}
              disabled={composerDisabled}
              placeholder={placeholder}
              aria-label={tr('Message Hermes', '给 Hermes 发消息')}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)',
                border: 'none',
                outline: 'none',
                resize: 'none',
              }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
              }}
            >
              <div style={{ display: 'flex', gap: 2 }}>
                <ComposerIconButton
                  title={tr('Attach', '附件')}
                  icon={<Paperclip size={13} aria-hidden="true" />}
                />
                <ComposerIconButton
                  title={tr('Slash command', '斜杠命令')}
                  icon={<Slash size={13} aria-hidden="true" />}
                />
                <ComposerIconButton
                  title={tr('Invoke skill', '调用技能')}
                  icon={<AtSign size={13} aria-hidden="true" />}
                />
              </div>
              {streaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label={tr('Stop streaming', '停止流式输出')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--danger)',
                    background: 'transparent',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--text-xs)',
                    cursor: 'pointer',
                  }}
                >
                  <StopCircle size={12} aria-hidden="true" />
                  {tr('Stop', '停止')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={emptyInput || composerDisabled}
                  aria-label={tr('Send', '发送')}
                  style={{
                    padding: 6,
                    borderRadius: 'var(--radius-md)',
                    border: 'none',
                    background:
                      emptyInput || composerDisabled
                        ? 'var(--bg-tertiary)'
                        : 'var(--accent)',
                    color:
                      emptyInput || composerDisabled
                        ? 'var(--text-muted)'
                        : '#fff',
                    cursor:
                      emptyInput || composerDisabled
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  <Send size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline helpers
// ---------------------------------------------------------------------------

function ComposerIconButton({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      style={{
        padding: 6,
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
      }}
    >
      {icon}
    </button>
  );
}

function HermesAvatar() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background:
          'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
        color: '#fff',
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      H
    </span>
  );
}

function renderLocalMessage(m: LocalMessage, lang: 'en' | 'zh') {
  const text = lang === 'zh' ? (m.textZh ?? '') : (m.textEn ?? '');
  if (m.role === 'user') {
    return (
      <div key={m.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <div
          style={{
            maxWidth: '75%',
            padding: '8px 14px',
            borderRadius: 14,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {text}
        </div>
      </div>
    );
  }
  if (m.role === 'assistant') {
    const isEmpty = text.length === 0;
    return (
      <div key={m.id} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 20 }}>
        <HermesAvatar />
        <div
          aria-live={m.streaming ? 'polite' : undefined}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.55,
            paddingTop: 4,
          }}
        >
          {isEmpty && m.streaming ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--text-muted)',
              }}
            >
              <Loader2
                size={12}
                aria-hidden="true"
                className="animate-spin"
              />
              <span style={{ fontSize: 'var(--text-xs)' }}>…</span>
            </span>
          ) : (
            <>
              {text}
              {m.streaming ? (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 14,
                    marginLeft: 2,
                    background: 'var(--accent)',
                    verticalAlign: 'text-bottom',
                    opacity: 0.8,
                  }}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }
  if (m.role === 'tool') {
    return (
      <div key={m.id} style={{ marginBottom: 16, marginLeft: 40 }}>
        <div
          style={{
            maxWidth: 560,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Terminal size={11} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
            <span style={{ color: 'var(--warning)' }}>{m.name}</span>
            <span style={{ color: 'var(--text-muted)' }}>({m.args})</span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.55,
            }}
          >
            {m.out}
          </div>
        </div>
      </div>
    );
  }
  if (m.role === 'subagent') {
    return (
      <div key={m.id} style={{ marginBottom: 16, marginLeft: 40 }}>
        <div
          style={{
            maxWidth: 560,
            padding: '10px 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            background: 'color-mix(in srgb, var(--accent) 5%, transparent)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--accent)',
              marginBottom: 4,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <GitBranch size={11} aria-hidden="true" />
            <span>subagent:{m.name}</span>
            {m.status === 'running' ? (
              <Loader2 size={10} aria-hidden="true" className="animate-spin" />
            ) : null}
          </div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
            }}
          >
            {text}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function renderApiMessage(m: SessionMessage, _lang: 'en' | 'zh') {
  if (m.role === 'user') {
    return (
      <div
        key={m.id}
        style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}
      >
        <div
          style={{
            maxWidth: '75%',
            padding: '8px 14px',
            borderRadius: 14,
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.55,
            whiteSpace: 'pre-wrap',
          }}
        >
          {m.content}
        </div>
      </div>
    );
  }
  if (m.role === 'assistant') {
    return (
      <div
        key={m.id}
        style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 20 }}
      >
        <HermesAvatar />
        <div
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.55,
            paddingTop: 4,
          }}
        >
          {m.content}
          {m.token_count ? (
            <div
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginTop: 4,
              }}
            >
              {m.token_count} tok
            </div>
          ) : null}
        </div>
      </div>
    );
  }
  if (m.role === 'tool') {
    return (
      <div key={m.id} style={{ marginBottom: 16, marginLeft: 40 }}>
        <div
          style={{
            maxWidth: 560,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Terminal
              size={11}
              aria-hidden="true"
              style={{ color: 'var(--text-muted)' }}
            />
            <span style={{ color: 'var(--warning)' }}>{m.tool_name ?? 'tool'}</span>
          </div>
          <div
            style={{
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.55,
            }}
          >
            {m.content}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function EmptyChat({ onPickSuggestion }: { onPickSuggestion: (t: string) => void }) {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        textAlign: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-lg)',
          background:
            'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
        }}
      >
        H
      </span>
      <h2
        style={{
          margin: 0,
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
        }}
      >
        Hermes
      </h2>
      <p
        style={{
          margin: 0,
          color: 'var(--text-muted)',
          fontSize: 'var(--text-xs)',
        }}
      >
        {tr('Type a message below', '在下方输入')} ·{' '}
        <span style={{ fontFamily: 'var(--font-mono)' }}>/</span>{' '}
        {tr('for commands', '呼出命令')} ·{' '}
        <span style={{ fontFamily: 'var(--font-mono)' }}>@</span>{' '}
        {tr('to invoke a skill', '调用技能')}
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          justifyContent: 'center',
          maxWidth: 560,
        }}
      >
        {SUGGESTIONS.map((s, i) => {
          const label = lang === 'zh' ? s.zh : s.en;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPickSuggestion(label)}
              style={{
                padding: '6px 12px',
                borderRadius: 9999,
                border: '1px solid var(--border-default)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ChatPage;
