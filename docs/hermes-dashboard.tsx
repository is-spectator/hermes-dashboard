import { useState, useRef, useEffect } from 'react';
import {
  Activity, Sparkles, Brain, Zap, MessageSquare, Wrench, Clock, DollarSign,
  Search, Sun, Moon, Circle, Check, X, Terminal, Github, Bell, Plus,
  Send, MessageCircle, Hash, Mail, Shield, Phone, Server, Home,
  ChevronRight, ChevronDown, MoreHorizontal, TrendingUp, Play, Pause, Edit3,
  BookOpen, Puzzle, Users, ArrowUpRight, Filter, Download, RefreshCw,
  Star, GitBranch, Cpu, Globe, Lock, Upload, FileText, Radio,
  SquarePen, CornerDownLeft, StopCircle, Paperclip, AtSign, Slash, Loader2,
  Share2, Trash2, Languages
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';

const NAV = [
  { id: 'chat', label_en: 'Chat', label_zh: '聊天', icon: MessageSquare, section: 'talk' },
  { id: 'overview', label_en: 'Overview', label_zh: '概览', icon: Home, section: 'observe' },
  { id: 'sessions', label_en: 'Sessions', label_zh: '会话', icon: BookOpen, section: 'observe' },
  { id: 'platforms', label_en: 'Platforms', label_zh: '平台', icon: Radio, section: 'observe' },
  { id: 'memory', label_en: 'Memory & You', label_zh: '记忆与你', icon: Brain, section: 'agent' },
  { id: 'skills', label_en: 'Skills', label_zh: '技能', icon: Sparkles, section: 'agent' },
  { id: 'tools', label_en: 'Tools & MCP', label_zh: '工具与 MCP', icon: Wrench, section: 'agent' },
  { id: 'schedules', label_en: 'Schedules & Costs', label_zh: '计划与成本', icon: Clock, section: 'settings' },
];

const NAV_SECTIONS = [
  { id: 'talk', en: 'Talk', zh: '对话' },
  { id: 'observe', en: 'Observe', zh: '观察' },
  { id: 'agent', en: 'Agent', zh: '代理' },
  { id: 'settings', en: 'Ops', zh: '运维' },
];

const activity7d = [
  { d: 'Mon', d_zh: '一', msg: 42, tok: 18 }, { d: 'Tue', d_zh: '二', msg: 38, tok: 22 },
  { d: 'Wed', d_zh: '三', msg: 55, tok: 31 }, { d: 'Thu', d_zh: '四', msg: 48, tok: 27 },
  { d: 'Fri', d_zh: '五', msg: 71, tok: 42 }, { d: 'Sat', d_zh: '六', msg: 29, tok: 15 },
  { d: 'Sun', d_zh: '日', msg: 34, tok: 19 },
];

const costByProvider = [
  { name: 'Nous Portal', v: 8.42 }, { name: 'OpenRouter', v: 4.18 },
  { name: 'z.ai / GLM', v: 2.31 }, { name: 'Anthropic', v: 1.87 },
  { name: 'Kimi', v: 0.64 },
];

const sessions = [
  { id: 1, title_en: 'Refactoring the async job queue', title_zh: '重构异步任务队列', platform: 'cli', time_en: '12m ago', time_zh: '12 分钟前', tokens: 18_420, msgs: 34, model: 'claude-sonnet-4.5', subagents: 2, hasSkill: true },
  { id: 2, title_en: 'Weekend trip planning — Big Sur', title_zh: '周末旅行计划 — Big Sur', platform: 'telegram', time_en: '2h ago', time_zh: '2 小时前', tokens: 7_210, msgs: 22, model: 'hermes-4-70b', subagents: 0, hasSkill: false },
  { id: 3, title_en: 'Morning briefing · Apr 18', title_zh: '晨间简报 · 4 月 18 日', platform: 'telegram', time_en: '6h ago', time_zh: '6 小时前', tokens: 3_890, msgs: 1, model: 'glm-4.6', subagents: 1, hasSkill: true, cron: true },
  { id: 4, title_en: 'Debug: RL trajectory compressor OOM', title_zh: '调试:RL 轨迹压缩器 OOM', platform: 'cli', time_en: '1d ago', time_zh: '1 天前', tokens: 42_100, msgs: 58, model: 'claude-sonnet-4.5', subagents: 4, hasSkill: false },
  { id: 5, title_en: 'Draft blog: closed learning loops', title_zh: '博客草稿:闭环学习循环', platform: 'discord', time_en: '1d ago', time_zh: '1 天前', tokens: 12_340, msgs: 19, model: 'hermes-4-405b', subagents: 0, hasSkill: true },
  { id: 6, title_en: 'Tax receipts from inbox scan', title_zh: '邮箱扫描税务收据', platform: 'email', time_en: '2d ago', time_zh: '2 天前', tokens: 5_210, msgs: 8, model: 'kimi-k2', subagents: 3, hasSkill: true, cron: true },
];

const learningFeed = [
  { type: 'skill_created', en: 'Created skill', zh: '创建技能', detail: 'github_pr_triage', time_en: '22m ago', time_zh: '22 分钟前', icon: Sparkles },
  { type: 'memory', en: 'Memory updated', zh: '记忆已更新', detail_en: 'Prefers pnpm over npm for new projects', detail_zh: '新项目偏好 pnpm 而非 npm', time_en: '1h ago', time_zh: '1 小时前', icon: Brain },
  { type: 'user_model', en: 'User model refined', zh: '用户模型更新', detail_en: 'Honcho: timezone confidence ↑ to 0.91', detail_zh: 'Honcho:时区置信度 ↑ 至 0.91', time_en: '3h ago', time_zh: '3 小时前', icon: Users },
  { type: 'skill_improved', en: 'Self-improved', zh: '自改进', detail_en: 'morning_briefing · +2 steps, -18% tokens', detail_zh: 'morning_briefing · +2 步, -18% tokens', time_en: '5h ago', time_zh: '5 小时前', icon: TrendingUp },
  { type: 'nudge', en: 'Persisted knowledge', zh: '知识已固化', detail_en: 'New rule added to MEMORY.md', detail_zh: '新规则已添加至 MEMORY.md', time_en: '8h ago', time_zh: '8 小时前', icon: Star },
];

const memoryEntries = [
  { k_en: 'Works on', k_zh: '工作方向', v_en: 'Super Agent OS — multi-zone agent orchestration. Control-plane-first architecture.', v_zh: 'Super Agent OS — 多区域 agent 编排。控制平面优先架构。', updated_en: '3h ago', updated_zh: '3 小时前', conf: 0.94 },
  { k_en: 'Communication style', k_zh: '沟通风格', v_en: 'Prefers concise, direct feedback. No throat-clearing. Chinese & English mixed.', v_zh: '偏好简洁直接的反馈。不寒暄。中英混用。', updated_en: '2d ago', updated_zh: '2 天前', conf: 0.88 },
  { k_en: 'Package manager', k_zh: '包管理器', v_en: 'pnpm for JS/TS, uv for Python. Avoid npm unless legacy.', v_zh: 'JS/TS 用 pnpm,Python 用 uv。除非历史项目,否则不用 npm。', updated_en: '1h ago', updated_zh: '1 小时前', conf: 0.82 },
  { k_en: 'Editor', k_zh: '编辑器', v_en: 'Neovim + tmux on remote, VS Code locally for notebooks.', v_zh: '远程用 Neovim + tmux,本地笔记用 VS Code。', updated_en: '1w ago', updated_zh: '1 周前', conf: 0.79 },
  { k_en: 'Coffee', k_zh: '咖啡', v_en: 'Pour-over, medium roast, no sugar.', v_zh: '手冲,中度烘焙,无糖。', updated_en: '2w ago', updated_zh: '2 周前', conf: 0.71 },
];

const userModel = [
  { en: 'Technical depth', zh: '技术深度', v: 92 },
  { en: 'Autonomy preference', zh: '自主性偏好', v: 85 },
  { en: 'Detail orientation', zh: '细节导向', v: 78 },
  { en: 'Humor tolerance', zh: '幽默容忍度', v: 64 },
  { en: 'Emoji usage', zh: 'Emoji 使用', v: 22 },
];

const personalities = [
  { name_en: 'Default', name_zh: '默认', active: true, desc_en: 'Balanced, concise, direct. No filler.', desc_zh: '平衡、简洁、直接。无废话。' },
  { name_en: 'Scribe', name_zh: '记录者', active: false, desc_en: 'Longer prose, documentation voice.', desc_zh: '长段落,文档风格。' },
  { name_en: 'Mentor', name_zh: '导师', active: false, desc_en: 'Explanatory, Socratic, asks questions back.', desc_zh: '解释式,苏格拉底式,会反问。' },
  { name_en: 'Hacker', name_zh: '黑客', active: false, desc_en: 'Terminal-native, shell snippets first.', desc_zh: '终端原生,优先给出 shell 片段。' },
];

const skills = [
  { name: 'morning_briefing', desc_en: 'Compiles calendar, weather, top news, overnight GitHub notifs.', desc_zh: '汇总日历、天气、头条新闻、昨夜 GitHub 通知。', uses: 142, success: 0.97, origin: 'self', updated: '5h', stars: 1 },
  { name: 'github_pr_triage', desc_en: 'Classifies incoming PRs, drafts review focus list.', desc_zh: '分类接收的 PR,起草评审重点列表。', uses: 3, success: 1.0, origin: 'self', updated: '22m', stars: 0, fresh: true },
  { name: 'summarize_arxiv', desc_en: 'Fetch arXiv paper → 5-bullet summary + key contributions.', desc_zh: '抓取 arXiv 论文 → 5 条摘要 + 核心贡献。', uses: 89, success: 0.93, origin: 'hub', updated: '3d', stars: 340 },
  { name: 'weekly_review', desc_en: 'Aggregates the week across platforms into a journal entry.', desc_zh: '跨平台汇总本周活动为一篇日志。', uses: 12, success: 0.92, origin: 'self', updated: '4d', stars: 0 },
  { name: 'code_explainer', desc_en: 'Walks through a file with architectural context.', desc_zh: '带架构上下文逐文件讲解。', uses: 67, success: 0.95, origin: 'hub', updated: '1w', stars: 892 },
  { name: 'expense_logger', desc_en: 'Parses receipt photos, logs to spreadsheet.', desc_zh: '解析收据图片,记录到表格。', uses: 28, success: 0.89, origin: 'self', updated: '1w', stars: 0 },
  { name: 'meeting_prep', desc_en: 'Given calendar event, pulls related docs + contact history.', desc_zh: '给定日历事件,拉取相关文档与联系人历史。', uses: 45, success: 0.91, origin: 'hub', updated: '2w', stars: 211 },
  { name: 'vps_health_check', desc_en: 'SSH into servers, report disk/CPU/service health.', desc_zh: 'SSH 到服务器,报告磁盘/CPU/服务健康度。', uses: 8, success: 1.0, origin: 'self', updated: '3w', stars: 0 },
];

const platforms = [
  { id: 'telegram', name: 'Telegram', icon: Send, connected: true, msgs: 87, users: 1, last_en: '12m ago', last_zh: '12 分钟前', color: 'text-sky-400' },
  { id: 'discord', name: 'Discord', icon: MessageSquare, connected: true, msgs: 34, users: 3, last_en: '1h ago', last_zh: '1 小时前', color: 'text-indigo-400' },
  { id: 'slack', name: 'Slack', icon: Hash, connected: true, msgs: 18, users: 2, last_en: '3h ago', last_zh: '3 小时前', color: 'text-fuchsia-400' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, connected: false, msgs: 0, users: 0, last_en: '—', last_zh: '—', color: 'text-emerald-400' },
  { id: 'signal', name: 'Signal', icon: Shield, connected: false, msgs: 0, users: 0, last_en: '—', last_zh: '—', color: 'text-blue-400' },
  { id: 'email', name: 'Email', icon: Mail, connected: true, msgs: 6, users: 1, last_en: '2d ago', last_zh: '2 天前', color: 'text-amber-400' },
];

const toolCategories = [
  { name_en: 'Filesystem', name_zh: '文件系统', tools: ['read_file', 'write_file', 'edit_file', 'glob', 'grep'], enabled: 5, total: 5 },
  { name_en: 'Shell & Terminal', name_zh: 'Shell 与终端', tools: ['bash', 'run_python', 'tmux_session'], enabled: 3, total: 3 },
  { name_en: 'Web', name_zh: 'Web', tools: ['web_fetch', 'web_search', 'browser_use'], enabled: 2, total: 3 },
  { name_en: 'Code', name_zh: '代码', tools: ['git', 'gh_cli', 'lsp_diagnostics', 'test_runner'], enabled: 4, total: 4 },
  { name_en: 'Memory & Skills', name_zh: '记忆与技能', tools: ['search_sessions', 'update_memory', 'create_skill', 'invoke_skill'], enabled: 4, total: 4 },
  { name_en: 'Media', name_zh: '媒体', tools: ['transcribe_audio', 'generate_tts', 'describe_image'], enabled: 1, total: 3 },
];

const mcpServers = [
  { name: 'filesystem', url: 'stdio://mcp-filesystem', tools: 11, status: 'connected' },
  { name: 'github', url: 'https://github-mcp.example.com', tools: 23, status: 'connected' },
  { name: 'linear', url: 'https://linear-mcp.example.com', tools: 8, status: 'connected' },
  { name: 'notion', url: 'https://notion-mcp.example.com', tools: 14, status: 'disconnected' },
];

const cronJobs = [
  { name_en: 'Morning briefing', name_zh: '晨间简报', cron: '0 8 * * *', next_en: 'Tomorrow, 8:00 AM', next_zh: '明天 8:00', platform: 'telegram', lastOk: true, runs: 47 },
  { name_en: 'Weekly review', name_zh: '每周回顾', cron: '0 18 * * SUN', next_en: 'Sun, 6:00 PM', next_zh: '周日 18:00', platform: 'cli', lastOk: true, runs: 12 },
  { name_en: 'VPS health audit', name_zh: 'VPS 健康巡检', cron: '0 */6 * * *', next_en: 'In 2h 14m', next_zh: '2 小时 14 分后', platform: 'discord', lastOk: true, runs: 188 },
  { name_en: 'Nightly memory nudge', name_zh: '夜间记忆整理', cron: '0 2 * * *', next_en: 'Tonight, 2:00 AM', next_zh: '今夜 2:00', platform: 'cli', lastOk: true, runs: 63 },
  { name_en: 'Expense scan', name_zh: '开销扫描', cron: '0 22 * * FRI', next_en: 'Fri, 10:00 PM', next_zh: '周五 22:00', platform: 'email', lastOk: false, runs: 11 },
];

const costDaily = [
  { d: '12', v: 1.2 }, { d: '13', v: 2.4 }, { d: '14', v: 1.8 },
  { d: '15', v: 3.1 }, { d: '16', v: 2.7 }, { d: '17', v: 4.2 }, { d: '18', v: 1.9 },
];

const PLATFORM_ICON = {
  cli: Terminal, telegram: Send, discord: MessageSquare, slack: Hash,
  whatsapp: MessageCircle, signal: Shield, email: Mail, web: Globe,
};

const initialChatSessions = [
  { id: 'c1', title_en: 'Refactoring the async queue', title_zh: '重构异步队列', updated_en: 'now', updated_zh: '现在', model: 'claude-sonnet-4.5', msgs: 8 },
  { id: 'c2', title_en: 'Big Sur trip plan', title_zh: 'Big Sur 旅行计划', updated_en: '2h ago', updated_zh: '2 小时前', model: 'hermes-4-70b', msgs: 14 },
  { id: 'c3', title_en: 'Draft blog: learning loops', title_zh: '博客草稿:学习循环', updated_en: '1d ago', updated_zh: '1 天前', model: 'hermes-4-405b', msgs: 22 },
  { id: 'c4', title_en: 'Debug trajectory compressor', title_zh: '调试轨迹压缩器', updated_en: '2d ago', updated_zh: '2 天前', model: 'claude-sonnet-4.5', msgs: 58 },
  { id: 'c5', title_en: 'Weekly review · Apr 14', title_zh: '每周回顾 · 4 月 14 日', updated_en: '4d ago', updated_zh: '4 天前', model: 'hermes-4-70b', msgs: 6 },
];

const initialMessages = {
  c1: [
    { id: 1, role: 'user', text_en: "Check the status of the queue refactor and tell me what's left.", text_zh: '查一下队列重构的进度,还剩什么要做。' },
    { id: 2, role: 'assistant', text_en: 'Looking at the branch now.', text_zh: '正在查看分支。' },
    { id: 3, role: 'tool', name: 'bash', args: 'git status', out: 'On branch refactor/async-queue\n3 files modified, 1 staged' },
    { id: 4, role: 'tool', name: 'read_file', args: 'workers/queue.py L120–180', out: 'async def retry_with_backoff(activity, max_attempts=5):\n    for i in range(max_attempts):\n        try:\n            return await activity()\n        except RetryableError:\n            await asyncio.sleep(2 ** i)' },
    { id: 5, role: 'assistant', text_en: "Three files are modified. The retry path still runs serially — that's the remaining work. Want me to spawn a subagent to draft the parallel version?", text_zh: '有三个文件已修改。重试路径仍是串行执行,这是剩下要改的部分。要不要派一个子 agent 起草并行版本?' },
    { id: 6, role: 'user', text_en: 'yes please', text_zh: '好,麻烦了' },
    { id: 7, role: 'subagent', name: 'parallel-draft', status: 'running', text_en: 'Spawned isolated subagent — drafting parallel retry with asyncio.gather + semaphore. Will return a diff when ready.', text_zh: '已派出隔离子 agent — 正在用 asyncio.gather + semaphore 起草并行重试。完成后会返回 diff。' },
    { id: 8, role: 'assistant', text_en: "Subagent is running. Should take about 2 minutes. I'll ping when the diff is ready. Anything else in the meantime?", text_zh: '子 agent 运行中,大约 2 分钟。diff 准备好会通知你。期间还有其他事吗?' },
  ],
  c2: [{ id: 1, role: 'user', text_en: "Planning a weekend to Big Sur...", text_zh: '计划去 Big Sur 过周末…' }, { id: 2, role: 'assistant', text_en: "I'll pull up route options and campsites.", text_zh: '我来拉路线选项和露营地。' }],
  c3: [{ id: 1, role: 'user', text_en: "Help me outline a blog post about closed learning loops.", text_zh: '帮我列一篇关于闭环学习循环的博客提纲。' }],
  c4: [{ id: 1, role: 'user', text_en: "The trajectory compressor is OOMing on long runs.", text_zh: '长时间运行时轨迹压缩器会 OOM。' }],
  c5: [{ id: 1, role: 'user', text_en: "Summarize my week.", text_zh: '总结一下我这周。' }],
};

const MODELS = ['claude-sonnet-4.5', 'hermes-4-70b', 'hermes-4-405b', 'glm-4.6', 'kimi-k2', 'gpt-4o'];

export default function HermesDashboard() {
  const [view, setView] = useState('chat');
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('en');
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [skillFilter, setSkillFilter] = useState('all');
  const [memTab, setMemTab] = useState('memory');
  const [toolsTab, setToolsTab] = useState('tools');
  const [selSession, setSelSession] = useState(1);

  const [chatSessions, setChatSessions] = useState(initialChatSessions);
  const [curChat, setCurChat] = useState('c1');
  const [messages, setMessages] = useState(initialMessages);
  const [chatInput, setChatInput] = useState('');
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [curModel, setCurModel] = useState('claude-sonnet-4.5');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const zh = lang === 'zh';
  const T = (en, cn) => zh ? cn : en;
  const curPersona = T('Default', '默认');

  const dark = theme === 'dark';
  const t = {
    bg: dark ? 'bg-neutral-950' : 'bg-neutral-50',
    card: dark ? 'bg-neutral-900/60' : 'bg-white',
    cardSolid: dark ? 'bg-neutral-900' : 'bg-white',
    border: dark ? 'border-neutral-800' : 'border-neutral-200',
    borderSoft: dark ? 'border-neutral-800/60' : 'border-neutral-200/70',
    text: dark ? 'text-neutral-100' : 'text-neutral-900',
    dim: dark ? 'text-neutral-400' : 'text-neutral-500',
    faint: dark ? 'text-neutral-500' : 'text-neutral-400',
    hover: dark ? 'hover:bg-neutral-800/60' : 'hover:bg-neutral-200/60',
    activeBg: dark ? 'bg-neutral-800' : 'bg-neutral-200',
    input: dark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200',
    chip: dark ? 'bg-neutral-800/60 text-neutral-300 border-neutral-700/60' : 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };

  const Card = ({ children, className = '' }) => (
    <div className={`${t.card} border ${t.border} rounded-xl ${className}`}>{children}</div>
  );
  const Chip = ({ children, className = '' }) => (
    <span className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border ${t.chip} ${className}`}>{children}</span>
  );
  const Dot = ({ ok = true }) => (
    <Circle size={6} className={`${ok ? 'fill-emerald-500 text-emerald-500' : 'fill-neutral-500 text-neutral-500'} shrink-0`} />
  );
  const KPI = ({ label, value, delta, sub }) => (
    <Card className="p-4">
      <div className={`text-xs ${t.dim} flex items-center justify-between`}>
        <span>{label}</span>
        {delta !== undefined && delta !== null && <span className={delta > 0 ? 'text-emerald-500' : 'text-rose-500'}>{delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%</span>}
      </div>
      <div className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</div>
      {sub && <div className={`text-xs ${t.faint} mt-0.5`}>{sub}</div>}
    </Card>
  );
  const SectionTitle = ({ children, hint, action }) => (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-medium">{children}</h3>
        {hint && <span className={`text-xs ${t.faint}`}>{hint}</span>}
      </div>
      {action}
    </div>
  );

  useEffect(() => {
    if (scrollRef.current && view === 'chat') scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, curChat, view]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); handleNewSession(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const curMessages = messages[curChat] || [];
  const curSession = chatSessions.find(s => s.id === curChat);

  const handleSend = () => {
    if (!chatInput.trim() || streaming) return;
    const text = chatInput.trim();
    const nextId = (curMessages.at(-1)?.id || 0) + 1;
    const userMsg = { id: nextId, role: 'user', text_en: text, text_zh: text };
    const newMessages = { ...messages, [curChat]: [...curMessages, userMsg] };
    if (curSession?.isNew) {
      const title = text.slice(0, 40) + (text.length > 40 ? '…' : '');
      setChatSessions(ss => ss.map(s => s.id === curChat ? { ...s, isNew: false, title_en: title, title_zh: title } : s));
    }
    setMessages(newMessages);
    setChatInput('');
    setStreaming(true);
    setTimeout(() => {
      const reply = {
        id: nextId + 1, role: 'assistant',
        text_en: "Got it. Working on that now — I'll spawn a subagent if the task needs parallelization, and persist anything worth remembering to MEMORY.md.",
        text_zh: '收到。我来处理 —— 如果任务需要并行化就派子 agent,值得记忆的内容会写入 MEMORY.md。'
      };
      setMessages(m => ({ ...m, [curChat]: [...(m[curChat] || []), reply] }));
      setStreaming(false);
    }, 1100);
  };

  const handleNewSession = () => {
    const id = 'c' + Date.now();
    const s = { id, title_en: 'New conversation', title_zh: '新对话', updated_en: 'now', updated_zh: '现在', model: curModel, msgs: 0, isNew: true };
    setChatSessions(ss => [s, ...ss]);
    setMessages(m => ({ ...m, [id]: [] }));
    setCurChat(id);
    setView('chat');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ====================== OVERVIEW ======================
  const Overview = () => (
    <div className="p-8 space-y-6 max-w-[1400px]">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold tracking-tight">{T('Good afternoon.', '下午好。')}</h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10">
            <Circle size={6} className="fill-emerald-500 text-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-500 font-medium">{T('Hermes is running', 'Hermes 运行中')}</span>
          </div>
        </div>
        <p className={`text-sm ${t.dim}`}>
          {T('Local · Docker backend · hermes-4-70b via Nous Portal · uptime 4d 12h', '本地 · Docker 后端 · 通过 Nous Portal 使用 hermes-4-70b · 运行 4 天 12 小时')}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <KPI label={T('Conversations today', '今日对话')} value="23" delta={12} sub={T('across 4 platforms', '跨 4 个平台')} />
        <KPI label={T('Tokens today', '今日 Tokens')} value="218.4K" delta={-4} sub={T('82% input · 18% output', '82% 输入 · 18% 输出')} />
        <KPI label={T('Cost today', '今日成本')} value="$1.92" delta={-8} sub={T('$17.42 this week', '本周 $17.42')} />
        <KPI label={T('Skills triggered', '触发的技能')} value="9" delta={22} sub={T('1 new, 1 self-improved', '1 新建,1 自改进')} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div>
            <SectionTitle hint={T('last 7 days', '过去 7 天')} action={<Chip>{T('Messages · Tokens (K)', '消息 · Tokens (K)')}</Chip>}>{T('Activity', '活动')}</SectionTitle>
            <Card className="p-4">
              <div className="h-48">
                <ResponsiveContainer>
                  <AreaChart data={activity7d}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#262626' : '#e5e5e5'} vertical={false} />
                    <XAxis dataKey={zh ? 'd_zh' : 'd'} stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: dark ? '#171717' : '#fff', border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`, borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="msg" stroke="#f59e0b" strokeWidth={2} fill="url(#g1)" />
                    <Line type="monotone" dataKey="tok" stroke={dark ? '#a3a3a3' : '#525252'} strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle hint={T('jump in to continue', '继续对话')} action={<button onClick={() => setView('sessions')} className={`text-xs ${t.dim} flex items-center gap-1 ${t.hover} px-2 py-1 rounded`}>{T('View all', '查看全部')} <ChevronRight size={12} /></button>}>{T('Recent sessions', '最近会话')}</SectionTitle>
            <Card className="divide-y divide-neutral-800/60">
              {sessions.slice(0, 5).map(s => {
                const Icon = PLATFORM_ICON[s.platform];
                return (
                  <div key={s.id} className={`px-4 py-3 flex items-center gap-3 ${t.hover} cursor-pointer`}>
                    <div className={`w-7 h-7 rounded-md border ${t.border} flex items-center justify-center shrink-0`}>
                      <Icon size={13} className={t.dim} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm truncate">{zh ? s.title_zh : s.title_en}</span>
                        {s.hasSkill && <Chip className="text-amber-500 border-amber-500/30 bg-amber-500/10"><Sparkles size={9} /> {T('skill', '技能')}</Chip>}
                        {s.cron && <Chip><Clock size={9} /> cron</Chip>}
                        {s.subagents > 0 && <Chip><GitBranch size={9} /> {s.subagents}</Chip>}
                      </div>
                      <div className={`text-xs ${t.faint} mt-0.5 flex items-center gap-2`}>
                        <span>{zh ? s.time_zh : s.time_en}</span> <span>·</span>
                        <span>{s.msgs} {T('msgs', '条')}</span> <span>·</span>
                        <span>{(s.tokens / 1000).toFixed(1)}K tok</span> <span>·</span>
                        <span className="font-mono">{s.model}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={t.faint} />
                  </div>
                );
              })}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle hint={T('what Hermes learned', 'Hermes 学到了什么')} action={<Chip className="text-amber-500 border-amber-500/30 bg-amber-500/10">{T('live', '实时')}</Chip>}>{T('Learning timeline', '学习时间线')}</SectionTitle>
            <Card className="p-0">
              <div className="relative">
                <div className={`absolute left-[26px] top-6 bottom-6 w-px ${dark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
                <div className="divide-y divide-neutral-800/60">
                  {learningFeed.map((f, i) => {
                    const Icon = f.icon;
                    return (
                      <div key={i} className="px-4 py-3 flex items-start gap-3 relative">
                        <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 z-10 mt-0.5">
                          <Icon size={10} className="text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm">
                            <span className={t.dim}>{zh ? f.zh : f.en} </span>
                            <span className="font-medium font-mono text-[13px]">{f.detail_en ? (zh ? f.detail_zh : f.detail_en) : f.detail}</span>
                          </div>
                          <div className={`text-xs ${t.faint} mt-0.5`}>{zh ? f.time_zh : f.time_en}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className={`px-4 py-2 border-t ${t.border} text-xs ${t.dim} flex items-center justify-between`}>
                <span>{T('47 events this week', '本周 47 条事件')}</span>
                <button className="text-amber-500 hover:underline">{T('Open full history →', '查看完整历史 →')}</button>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>{T('Platforms', '平台')}</SectionTitle>
            <Card className="p-3 grid grid-cols-3 gap-2">
              {platforms.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className={`p-2 rounded-lg border ${t.borderSoft} ${p.connected ? '' : 'opacity-40'}`}>
                    <div className="flex items-center justify-between">
                      <Icon size={14} className={p.color} />
                      <Dot ok={p.connected} />
                    </div>
                    <div className="text-xs font-medium mt-1.5">{p.name}</div>
                    <div className={`text-[10px] ${t.faint}`}>{p.connected ? T(`${p.msgs} today`, `今日 ${p.msgs} 条`) : T('not paired', '未配对')}</div>
                  </div>
                );
              })}
            </Card>
          </div>

          <div>
            <SectionTitle>{T('Next up', '即将执行')}</SectionTitle>
            <Card className="p-3 space-y-2">
              {cronJobs.slice(0, 3).map((c, i) => {
                const Icon = PLATFORM_ICON[c.platform];
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <Clock size={13} className={i === 0 ? 'text-amber-500' : t.faint} />
                    <div className="flex-1">
                      <div className="text-sm">{zh ? c.name_zh : c.name_en}</div>
                      <div className={`text-xs ${t.faint}`}>{zh ? c.next_zh : c.next_en} → {c.platform}</div>
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );

  // ====================== SESSIONS ======================
  const Sessions = () => {
    const sel = sessions.find(s => s.id === selSession) || sessions[0];
    const SelIcon = PLATFORM_ICON[sel.platform];
    return (
      <div className="flex h-full">
        <div className={`w-[380px] border-r ${t.border} flex flex-col shrink-0`}>
          <div className={`p-4 border-b ${t.border} space-y-3`}>
            <h2 className="text-lg font-semibold">{T('Sessions', '会话')}</h2>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${t.input}`}>
              <Search size={13} className={t.dim} />
              <input placeholder={T('FTS5: model:claude after:2026-04-15', 'FTS5: model:claude after:2026-04-15')} className={`flex-1 bg-transparent text-sm outline-none ${t.text}`} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[T('All', '全部'), 'Telegram', 'Discord', 'CLI', T('Has skill', '带技能')].map(f => (
                <button key={f} className={`text-xs px-2 py-1 rounded border ${t.chip} ${t.hover}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {sessions.map(s => {
              const Icon = PLATFORM_ICON[s.platform];
              const selected = s.id === selSession;
              return (
                <div key={s.id} onClick={() => setSelSession(s.id)}
                  className={`px-4 py-3 border-b ${t.borderSoft} cursor-pointer ${selected ? t.activeBg : t.hover}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={12} className={t.dim} />
                    <span className="text-sm font-medium truncate flex-1">{zh ? s.title_zh : s.title_en}</span>
                    {s.hasSkill && <Sparkles size={11} className="text-amber-500" />}
                  </div>
                  <div className={`text-xs ${t.faint} flex items-center gap-2`}>
                    <span>{zh ? s.time_zh : s.time_en}</span><span>·</span>
                    <span>{s.msgs} {T('msgs', '条')}</span><span>·</span>
                    <span>{(s.tokens / 1000).toFixed(1)}K</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <SelIcon size={14} className={t.dim} />
                  <span className={`text-xs ${t.dim} capitalize`}>{sel.platform}</span>
                  <span className={t.faint}>·</span>
                  <span className={`text-xs ${t.faint}`}>{zh ? sel.time_zh : sel.time_en}</span>
                </div>
                <h2 className="text-xl font-semibold">{zh ? sel.title_zh : sel.title_en}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button className={`p-1.5 rounded ${t.hover}`}><Download size={13} /></button>
                <button className={`p-1.5 rounded ${t.hover}`}><MoreHorizontal size={13} /></button>
              </div>
            </div>

            <Card className="p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-amber-500" />
                <span className="text-xs font-medium text-amber-500">{T('AI summary', 'AI 摘要')}</span>
              </div>
              <p className={`text-sm ${t.dim} leading-relaxed`}>
                {T(
                  <>Refactored the async job queue to use Temporal instead of Celery. Spawned 2 subagents to draft migration scripts and benchmark results. Identified the OOM root cause in trajectory compressor as a missing chunk flush. Created skill <span className="font-mono text-amber-500">github_pr_triage</span> from the repeated PR review workflow.</>,
                  <>将异步任务队列从 Celery 迁移到 Temporal。派出 2 个子 agent 起草迁移脚本和基准测试。定位到轨迹压缩器 OOM 的根因是缺少 chunk flush。从重复的 PR 评审流程中自动创建了技能 <span className="font-mono text-amber-500">github_pr_triage</span>。</>
                )}
              </p>
            </Card>

            <div className="grid grid-cols-4 gap-2 mb-6">
              <Card className="p-3"><div className={`text-xs ${t.dim}`}>{T('Messages', '消息')}</div><div className="text-lg font-semibold">{sel.msgs}</div></Card>
              <Card className="p-3"><div className={`text-xs ${t.dim}`}>Tokens</div><div className="text-lg font-semibold">{(sel.tokens / 1000).toFixed(1)}K</div></Card>
              <Card className="p-3"><div className={`text-xs ${t.dim}`}>{T('Subagents', '子代理')}</div><div className="text-lg font-semibold">{sel.subagents}</div></Card>
              <Card className="p-3"><div className={`text-xs ${t.dim}`}>{T('Cost', '成本')}</div><div className="text-lg font-semibold">$0.42</div></Card>
            </div>

            <h3 className="text-sm font-medium mb-3">{T('Conversation preview', '对话预览')}</h3>
            <Card className="p-4 space-y-4">
              {[
                { role: 'user', en: 'The async job queue is causing latency spikes when Temporal retries pile up. Can you refactor it?', zhs: '当 Temporal 重试堆积时,异步任务队列会导致延迟突增。能重构一下吗?' },
                { role: 'agent', en: "Looking at `workers/queue.py`. The bottleneck is serial activity execution. I'll spawn a subagent to benchmark parallel dispatch.", zhs: '在看 `workers/queue.py`。瓶颈是活动的串行执行。我派一个子 agent 来基准并行调度。' },
                { role: 'tool', en: 'spawn_subagent("benchmark") → pid 4821', zhs: 'spawn_subagent("benchmark") → pid 4821' },
                { role: 'agent', en: 'Parallel dispatch cuts p99 from 840ms to 190ms. Noting this pattern as a new skill.', zhs: '并行调度把 p99 从 840ms 降到 190ms。将此模式记录为新技能。' },
              ].map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`text-xs font-mono ${t.faint} w-16 shrink-0 pt-0.5`}>
                    {m.role === 'user' ? T('you', '你') : m.role === 'agent' ? 'hermes' : 'tool'}
                  </div>
                  <div className={`text-sm flex-1 ${m.role === 'tool' ? `font-mono text-xs ${t.dim} whitespace-pre` : ''}`}>{zh ? m.zhs : m.en}</div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // ====================== MEMORY ======================
  const Memory = () => (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">{T('Memory & You', '记忆与你')}</h1>
        <p className={`text-sm ${t.dim}`}>{T('What Hermes remembers, infers, and how it speaks. All editable — it stays at', 'Hermes 记住什么、推断什么、如何表达。全部可编辑,存放于')} <span className="font-mono text-xs">~/.hermes/</span></p>
      </div>

      <div className={`flex items-center gap-1 border-b ${t.border} mb-6`}>
        {[
          { id: 'memory', label: T('Memory', '记忆'), file: 'MEMORY.md' },
          { id: 'profile', label: T('User profile', '用户画像'), file: 'USER.md · Honcho' },
          { id: 'personality', label: T('Personality', '人格'), file: 'SOUL.md' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setMemTab(tab.id)}
            className={`px-4 py-2.5 text-sm relative ${memTab === tab.id ? '' : t.dim}`}>
            {tab.label}
            <span className={`ml-2 text-[10px] font-mono ${t.faint}`}>{tab.file}</span>
            {memTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-amber-500" />}
          </button>
        ))}
      </div>

      {memTab === 'memory' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs ${t.dim}`}>{memoryEntries.length} {T('entries · last nudged 8h ago · confidence is Honcho\'s', '条 · 上次更新 8 小时前 · 置信度来自 Honcho')}</p>
            <button className="flex items-center gap-1.5 text-xs text-amber-500 hover:underline"><Plus size={12} /> {T('Add entry', '新增')}</button>
          </div>
          {memoryEntries.map((m, i) => (
            <Card key={i} className="p-4 group">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-amber-500 mb-1 uppercase tracking-wide">{zh ? m.k_zh : m.k_en}</div>
                  <div className="text-sm">{zh ? m.v_zh : m.v_en}</div>
                  <div className={`text-xs ${t.faint} mt-2 flex items-center gap-3`}>
                    <span>{T('updated', '更新于')} {zh ? m.updated_zh : m.updated_en}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-20 h-1 rounded-full ${dark ? 'bg-neutral-800' : 'bg-neutral-200'} overflow-hidden`}>
                        <div className="h-full bg-amber-500" style={{ width: `${m.conf * 100}%` }} />
                      </div>
                      <span>{T('conf', '置信度')} {m.conf.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button className={`opacity-0 group-hover:opacity-100 p-1 rounded ${t.hover}`}><Edit3 size={12} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {memTab === 'profile' && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={14} className="text-amber-500" />
              <h3 className="text-sm font-medium">{T('Inferred traits', '推断特征')}</h3>
              <span className={`text-xs ${t.faint}`}>{T('from Honcho dialectic model', '来自 Honcho 对话模型')}</span>
            </div>
            <div className="space-y-3">
              {userModel.map((u, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{zh ? u.zh : u.en}</span>
                    <span className={t.faint}>{u.v}</span>
                  </div>
                  <div className={`h-1 rounded-full ${dark ? 'bg-neutral-800' : 'bg-neutral-200'} overflow-hidden`}>
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${u.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={14} className="text-amber-500" />
              <h3 className="text-sm font-medium">{T('Summary', '摘要')}</h3>
            </div>
            <div className={`text-sm ${t.dim} leading-relaxed space-y-3`}>
              <p>{T("You're a technical builder working on a multi-zone agent orchestration platform. You think in systems and prefer control-plane clarity over one-shot answers.", '你是一位技术型的建造者,正在构建一个多区域 agent 编排平台。你习惯系统化思考,偏好控制平面上的清晰感,而非一次性的答案。')}</p>
              <p>{T("Communication-wise, you want responses that get to the point. You'll push back if something feels hand-wavy.", '在沟通上,你希望回复开门见山。如果内容含糊其辞,你会直接挑战。')}</p>
              <p>{T('Timezone America/Los_Angeles (conf 0.91), active mostly 9am–1am with a midday break.', '时区 America/Los_Angeles(置信度 0.91),活跃时段约 9:00–次日 1:00,中午有短暂休息。')}</p>
            </div>
          </Card>
        </div>
      )}

      {memTab === 'personality' && (
        <div className="grid grid-cols-2 gap-3">
          {personalities.map((p, i) => (
            <Card key={i} className={`p-4 ${p.active ? 'ring-1 ring-amber-500/50' : ''} cursor-pointer ${t.hover}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{zh ? p.name_zh : p.name_en}</span>
                  {p.active && <Chip className="text-amber-500 border-amber-500/30 bg-amber-500/10">{T('active', '启用中')}</Chip>}
                </div>
                <button className={`p-1 rounded ${t.hover}`}><Edit3 size={12} /></button>
              </div>
              <p className={`text-sm ${t.dim}`}>{zh ? p.desc_zh : p.desc_en}</p>
            </Card>
          ))}
          <Card className={`p-4 border-dashed flex items-center justify-center cursor-pointer ${t.hover}`}>
            <div className={`flex items-center gap-2 text-sm ${t.dim}`}>
              <Plus size={14} /> {T('New personality', '新建人格')}
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  // ====================== SKILLS ======================
  const Skills = () => {
    const filtered = skills.filter(s =>
      skillFilter === 'all' || (skillFilter === 'self' && s.origin === 'self') || (skillFilter === 'hub' && s.origin === 'hub')
    );
    return (
      <div className="p-8 max-w-[1400px]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">{T('Skills', '技能')}</h1>
            <p className={`text-sm ${t.dim}`}>{T('Procedural memory · self-created from experience or imported from', '程序性记忆 · 从经验中自动创建,或从')} <a className="text-amber-500 hover:underline">agentskills.io</a>{T('', ' 导入')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${t.chip} ${t.hover}`}>
              <Upload size={12} /> {T('Browse Hub', '浏览 Hub')}
            </button>
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500 text-neutral-900 font-medium hover:bg-amber-400">
              <Plus size={12} /> {T('New skill', '新建技能')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5">
          {[
            { id: 'all', en: 'All', zh: '全部', count: skills.length },
            { id: 'self', en: 'Self-created', zh: '自创建', count: skills.filter(s => s.origin === 'self').length },
            { id: 'hub', en: 'From Hub', zh: '来自 Hub', count: skills.filter(s => s.origin === 'hub').length },
          ].map(f => (
            <button key={f.id} onClick={() => setSkillFilter(f.id)}
              className={`text-xs px-3 py-1.5 rounded-md border ${skillFilter === f.id ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : t.chip}`}>
              {zh ? f.zh : f.en} ({f.count})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filtered.map(s => (
            <Card key={s.name} className={`p-4 ${t.hover} cursor-pointer ${s.fresh ? 'ring-1 ring-amber-500/40' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {s.origin === 'self' ? <Sparkles size={13} className="text-amber-500 shrink-0" /> : <Puzzle size={13} className="text-blue-400 shrink-0" />}
                  <span className="text-sm font-mono font-medium truncate">{s.name}</span>
                </div>
                {s.fresh && <Chip className="text-amber-500 border-amber-500/30 bg-amber-500/10">{T('new', '新')}</Chip>}
              </div>
              <p className={`text-xs ${t.dim} mb-3 line-clamp-2 h-8`}>{zh ? s.desc_zh : s.desc_en}</p>
              <div className="flex items-center justify-between">
                <div className={`text-xs ${t.faint} flex items-center gap-2`}>
                  <span>{s.uses} {T('uses', '次')}</span><span>·</span>
                  <span className={s.success >= 0.95 ? 'text-emerald-500' : s.success >= 0.9 ? 'text-amber-500' : 'text-rose-500'}>
                    {(s.success * 100).toFixed(0)}%
                  </span>
                </div>
                {s.stars > 0 && (
                  <div className={`text-xs ${t.faint} flex items-center gap-1`}>
                    <Star size={10} /> {s.stars}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // ====================== PLATFORMS ======================
  const Platforms = () => (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">{T('Platforms', '平台')}</h1>
        <p className={`text-sm ${t.dim}`}>{T('Your messaging gateway — same agent, any channel. Configure with', '你的消息网关 —— 同一个 agent,任意渠道。通过')} <span className="font-mono text-xs">hermes gateway setup</span> {T('', '配置')}</p>
      </div>

      <Card className="p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <Radio size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-sm font-medium">{T('Gateway is running', '网关运行中')}</div>
            <div className={`text-xs ${t.faint}`}>{T('PID 2841 · uptime 4d 12h · 4 platforms active · 145 messages today', 'PID 2841 · 运行 4 天 12 小时 · 4 个平台激活 · 今日 145 条消息')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border ${t.chip} ${t.hover}`}>
            <RefreshCw size={12} /> {T('Restart', '重启')}
          </button>
          <button className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10`}>
            <Pause size={12} /> {T('Stop', '停止')}
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {platforms.map(p => {
          const Icon = p.icon;
          return (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg border ${t.border} flex items-center justify-center`}>
                  <Icon size={16} className={p.color} />
                </div>
                <Chip className={p.connected ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : ''}>
                  <Dot ok={p.connected} /> {p.connected ? T('connected', '已连接') : T('not paired', '未配对')}
                </Chip>
              </div>
              <div className="text-sm font-medium mb-1">{p.name}</div>
              {p.connected ? (
                <>
                  <div className={`text-xs ${t.faint}`}>{T(`${p.msgs} msgs today · ${p.users} allowed user${p.users !== 1 ? 's' : ''}`, `今日 ${p.msgs} 条 · ${p.users} 个允许用户`)}</div>
                  <div className={`text-xs ${t.faint} mt-0.5`}>{T('last:', '最近:')} {zh ? p.last_zh : p.last_en}</div>
                </>
              ) : (
                <button className="text-xs text-amber-500 hover:underline mt-1">{T('Pair now →', '立即配对 →')}</button>
              )}
            </Card>
          );
        })}
      </div>

      <SectionTitle hint={T('messages per platform, last 7d', '各平台消息量,近 7 天')}>{T('Message volume', '消息量')}</SectionTitle>
      <Card className="p-4">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={activity7d}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#262626' : '#e5e5e5'} vertical={false} />
              <XAxis dataKey={zh ? 'd_zh' : 'd'} stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: dark ? '#171717' : '#fff', border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`, borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="msg" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  // ====================== TOOLS ======================
  const Tools = () => (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">{T('Tools & MCP', '工具与 MCP')}</h1>
        <p className={`text-sm ${t.dim}`}>{T('40+ built-in tools plus any MCP server. Configure with', '40+ 内置工具加任意 MCP 服务器。通过')} <span className="font-mono text-xs">hermes tools</span>{T('', ' 配置')}</p>
      </div>

      <div className={`flex items-center gap-1 border-b ${t.border} mb-6`}>
        {[{ id: 'tools', l: T('Built-in tools', '内置工具') }, { id: 'mcp', l: T('MCP servers', 'MCP 服务器') }].map(tab => (
          <button key={tab.id} onClick={() => setToolsTab(tab.id)}
            className={`px-4 py-2.5 text-sm relative ${toolsTab === tab.id ? '' : t.dim}`}>
            {tab.l}
            {toolsTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-px bg-amber-500" />}
          </button>
        ))}
      </div>

      {toolsTab === 'tools' ? (
        <div className="space-y-3">
          {toolCategories.map((c, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench size={13} className="text-amber-500" />
                  <span className="text-sm font-medium">{zh ? c.name_zh : c.name_en}</span>
                  <span className={`text-xs ${t.faint}`}>{c.enabled}/{c.total} {T('enabled', '已启用')}</span>
                </div>
                <button className={`text-xs ${t.dim} ${t.hover} px-2 py-1 rounded`}>{T('Configure', '配置')}</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c.tools.map((tl, j) => (
                  <span key={j} className={`text-xs px-2 py-1 rounded border ${j < c.enabled ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500' : `${t.chip} opacity-50`} font-mono`}>
                    {j < c.enabled && <Check size={10} className="inline mr-1" />}{tl}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end mb-3">
            <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500 text-neutral-900 font-medium hover:bg-amber-400">
              <Plus size={12} /> {T('Add MCP server', '添加 MCP 服务器')}
            </button>
          </div>
          {mcpServers.map((s, i) => (
            <Card key={i} className="p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-lg border ${t.border} flex items-center justify-center`}>
                <Server size={14} className={t.dim} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono">{s.name}</span>
                  <Chip className={s.status === 'connected' ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-neutral-500'}>
                    <Dot ok={s.status === 'connected'} /> {s.status === 'connected' ? T('connected', '已连接') : T('disconnected', '未连接')}
                  </Chip>
                </div>
                <div className={`text-xs ${t.faint} mt-0.5 font-mono truncate`}>{s.url}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{s.tools}</div>
                <div className={`text-xs ${t.faint}`}>{T('tools', '工具')}</div>
              </div>
              <button className={`p-1.5 rounded ${t.hover}`}><MoreHorizontal size={14} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // ====================== SCHEDULES & COSTS ======================
  const Schedules = () => (
    <div className="p-8 max-w-[1400px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">{T('Schedules & Costs', '计划与成本')}</h1>
        <p className={`text-sm ${t.dim}`}>{T("Cron jobs deliver to any platform. Track spend across every provider you've plugged in.", 'Cron 任务可投递到任意平台。追踪每个 provider 的花费。')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <KPI label={T('Today', '今日')} value="$1.92" sub={T('↓ 8% vs yesterday', '↓ 8% 对比昨日')} />
        <KPI label={T('This week', '本周')} value="$17.42" sub={T('23% under budget', '低于预算 23%')} />
        <KPI label={T('This month', '本月')} value="$62.18" sub={T('$80 budget · 22 days', '预算 $80 · 22 天')} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <Card className="col-span-2 p-4">
          <SectionTitle hint={T('last 7 days', '过去 7 天')}>{T('Daily spend', '日均花费')}</SectionTitle>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={costDaily}>
                <defs>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#262626' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="d" stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={dark ? '#737373' : '#a3a3a3'} fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip contentStyle={{ background: dark ? '#171717' : '#fff', border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`, borderRadius: 8, fontSize: 12 }} formatter={v => [`$${v}`, T('Cost', '成本')]} />
                <Area type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <SectionTitle hint={T('this week', '本周')}>{T('By provider', '按 provider')}</SectionTitle>
          <div className="space-y-3 mt-4">
            {costByProvider.map((c, i) => {
              const total = costByProvider.reduce((s, x) => s + x.v, 0);
              const pct = (c.v / total) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{c.name}</span>
                    <span className={t.faint}>${c.v.toFixed(2)}</span>
                  </div>
                  <div className={`h-1 rounded-full ${dark ? 'bg-neutral-800' : 'bg-neutral-200'} overflow-hidden`}>
                    <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <SectionTitle hint={`${cronJobs.length} ${T('active', '激活')}`} action={
        <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-amber-500 text-neutral-900 font-medium hover:bg-amber-400">
          <Plus size={12} /> {T('New schedule', '新建计划')}
        </button>
      }>{T('Scheduled automations', '定时自动化')}</SectionTitle>

      <Card className="divide-y divide-neutral-800/60">
        <div className={`px-4 py-2 grid grid-cols-12 gap-3 text-xs ${t.faint} font-medium`}>
          <div className="col-span-4">{T('Name', '名称')}</div>
          <div className="col-span-2 font-mono">Cron</div>
          <div className="col-span-3">{T('Next run', '下次执行')}</div>
          <div className="col-span-2">{T('Delivery', '投递到')}</div>
          <div className="col-span-1 text-right">{T('Runs', '次数')}</div>
        </div>
        {cronJobs.map((c, i) => {
          const Icon = PLATFORM_ICON[c.platform];
          return (
            <div key={i} className={`px-4 py-3 grid grid-cols-12 gap-3 items-center ${t.hover} cursor-pointer`}>
              <div className="col-span-4 flex items-center gap-2">
                <Dot ok={c.lastOk} />
                <span className="text-sm">{zh ? c.name_zh : c.name_en}</span>
              </div>
              <div className={`col-span-2 text-xs font-mono ${t.dim}`}>{c.cron}</div>
              <div className="col-span-3 text-sm">{zh ? c.next_zh : c.next_en}</div>
              <div className="col-span-2 flex items-center gap-1.5">
                <Icon size={12} className={t.dim} />
                <span className={`text-xs ${t.dim} capitalize`}>{c.platform}</span>
              </div>
              <div className={`col-span-1 text-sm text-right ${t.faint}`}>{c.runs}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );

  // ====================== CHAT ======================
  const renderMessage = (m) => {
    const text = zh ? m.text_zh : m.text_en;
    if (m.role === 'user') {
      return (
        <div key={m.id} className="flex justify-end mb-5">
          <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md ${dark ? 'bg-neutral-800' : 'bg-neutral-200'} text-sm leading-relaxed`}>
            {text}
          </div>
        </div>
      );
    }
    if (m.role === 'assistant') {
      return (
        <div key={m.id} className="flex gap-3 mb-5">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-900 font-bold text-sm leading-none shrink-0 mt-0.5">☤</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm leading-relaxed whitespace-pre-wrap pt-0.5">{text}</div>
          </div>
        </div>
      );
    }
    if (m.role === 'tool') {
      return (
        <div key={m.id} className="mb-4 ml-10">
          <div className={`rounded-lg border ${t.border} ${dark ? 'bg-neutral-900/50' : 'bg-neutral-50'} overflow-hidden max-w-xl`}>
            <div className={`px-3 py-1.5 flex items-center gap-1.5 text-[11px] border-b ${t.borderSoft}`}>
              <Terminal size={11} className={t.dim} />
              <span className="font-mono text-amber-500">{m.name}</span>
              <span className={`font-mono ${t.faint} truncate`}>({m.args})</span>
            </div>
            <div className={`px-3 py-2 font-mono text-[11px] ${t.dim} whitespace-pre-wrap leading-relaxed`}>{m.out}</div>
          </div>
        </div>
      );
    }
    if (m.role === 'subagent') {
      return (
        <div key={m.id} className="mb-4 ml-10">
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2.5 max-w-xl">
            <div className="flex items-center gap-1.5 text-[11px] mb-1">
              <GitBranch size={11} className="text-blue-400" />
              <span className="font-mono text-blue-400">subagent:{m.name}</span>
              <span className="text-blue-400/60">·</span>
              <span className="text-blue-400/80 flex items-center gap-1">
                {m.status === 'running' && <Loader2 size={10} className="animate-spin" />}
                {m.status === 'running' ? T('running', '运行中') : m.status}
              </span>
            </div>
            <div className={`text-xs ${t.dim}`}>{text}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const SUGGESTIONS = [
    { icon: Sparkles, en: 'Draft a new skill from my recent PRs', zh: '基于最近的 PR 起草一个新技能' },
    { icon: FileText, en: 'Summarize what I did this week', zh: '总结我这周做了什么' },
    { icon: Brain, en: 'What do you remember about me?', zh: '你对我还记得什么?' },
    { icon: Terminal, en: 'SSH into prod and check disk usage', zh: 'SSH 到生产环境检查磁盘使用' },
  ];

  const ChatView = () => (
    <div className="flex flex-col h-full">
      <div className={`border-b ${t.border} px-5 py-2.5 flex items-center justify-between shrink-0 gap-3`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative">
            <button onClick={() => setSessionMenuOpen(o => !o)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${t.input} ${t.hover} min-w-0 max-w-xs`}>
              <Globe size={12} className={t.faint} />
              <span className="text-sm truncate">{curSession ? (zh ? curSession.title_zh : curSession.title_en) : T('New conversation', '新对话')}</span>
              <ChevronDown size={11} className={`${t.faint} shrink-0`} />
            </button>
            {sessionMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSessionMenuOpen(false)} />
                <div className={`absolute top-full left-0 mt-1 w-80 rounded-lg border ${t.border} ${t.cardSolid} shadow-xl z-20 overflow-hidden`}>
                  <div className={`px-3 py-2 text-[10px] font-medium ${t.faint} uppercase tracking-wide border-b ${t.borderSoft}`}>
                    {T('Recent conversations', '最近对话')}
                  </div>
                  <div className="max-h-72 overflow-auto">
                    {chatSessions.map(s => (
                      <button key={s.id} onClick={() => { setCurChat(s.id); setSessionMenuOpen(false); }}
                        className={`w-full px-3 py-2 flex items-center gap-2 text-left ${s.id === curChat ? t.activeBg : t.hover}`}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">{zh ? s.title_zh : s.title_en}</div>
                          <div className={`text-[10px] ${t.faint}`}>{zh ? s.updated_zh : s.updated_en} · {s.msgs} {T('msgs', '条')} · {s.model}</div>
                        </div>
                        {s.id === curChat && <Check size={12} className="text-amber-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <div className={`border-t ${t.borderSoft}`}>
                    <button onClick={() => { handleNewSession(); setSessionMenuOpen(false); }}
                      className={`w-full px-3 py-2 flex items-center gap-2 text-sm text-amber-500 ${t.hover}`}>
                      <Plus size={12} /> {T('New conversation', '新对话')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setModelMenuOpen(o => !o)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border ${t.input} ${t.hover}`}>
              <Cpu size={11} className={t.faint} />
              <span className={`text-xs ${t.dim}`}>{curPersona} ·</span>
              <span className="text-xs font-mono">{curModel}</span>
              <ChevronDown size={11} className={t.faint} />
            </button>
            {modelMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setModelMenuOpen(false)} />
                <div className={`absolute top-full left-0 mt-1 w-64 rounded-lg border ${t.border} ${t.cardSolid} shadow-xl z-20 overflow-hidden`}>
                  <div className={`px-3 py-2 text-[10px] font-medium ${t.faint} uppercase tracking-wide border-b ${t.borderSoft}`}>{T('Model', '模型')}</div>
                  {MODELS.map(m => (
                    <button key={m} onClick={() => { setCurModel(m); setModelMenuOpen(false); }}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-left text-xs font-mono ${m === curModel ? t.activeBg : t.hover}`}>
                      <span>{m}</span>
                      {m === curModel && <Check size={11} className="text-amber-500" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={handleNewSession} title={T('New conversation (⌘K)', '新对话(⌘K)')} className={`p-1.5 rounded-md ${t.hover}`}>
            <SquarePen size={14} />
          </button>
          <button className={`p-1.5 rounded-md ${t.hover}`} title={T('Refresh', '刷新')}><RefreshCw size={13} /></button>
          <div className={`w-px h-4 mx-1 ${dark ? 'bg-neutral-800' : 'bg-neutral-200'}`} />
          <button className={`p-1.5 rounded-md ${t.hover}`} title={T('Share', '分享')}><Share2 size={13} /></button>
          <button className={`p-1.5 rounded-md ${t.hover}`} title={T('Export', '导出')}><Download size={13} /></button>
          <button className={`p-1.5 rounded-md ${t.hover}`} title={T('More', '更多')}><MoreHorizontal size={14} /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        {curMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-900 font-bold text-3xl mb-4">☤</div>
            <h3 className="text-xl font-semibold mb-2">Hermes</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-4">
              <Circle size={6} className="fill-emerald-500 text-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium">{T('Ready to chat', '就绪')}</span>
            </div>
            <p className={`text-xs ${t.faint} mb-6`}>
              {T('Type a message below', '在下方输入')} · <span className="font-mono">/</span> {T('for commands', '呼出命令')} · <span className="font-mono">@</span> {T('to invoke a skill', '调用技能')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => { setChatInput(zh ? s.zh : s.en); inputRef.current?.focus(); }}
                  className={`px-3 py-1.5 rounded-full border ${t.border} ${t.hover} text-xs ${t.dim}`}>
                  {zh ? s.zh : s.en}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6">
            {curMessages.map(renderMessage)}
            {streaming && (
              <div className="flex gap-3 mb-5">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-900 font-bold text-sm leading-none shrink-0 mt-0.5">☤</div>
                <div className={`flex items-center gap-2 ${t.dim} text-sm pt-1.5`}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{T('Hermes is thinking…', 'Hermes 思考中…')}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-6 pb-5 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-2xl border ${t.input} focus-within:border-amber-500/40 transition-colors`}>
            <textarea
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={T('Message Hermes (Enter to send)', '给 Hermes 发消息(回车发送)')}
              rows={2}
              className={`w-full bg-transparent px-4 pt-3 pb-2 text-sm outline-none resize-none ${t.text} placeholder:${t.faint}`}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <div className="flex items-center gap-0.5">
                <button className={`p-1.5 rounded ${t.hover}`} title={T('Attach', '附件')}><Paperclip size={13} /></button>
                <button className={`p-1.5 rounded ${t.hover}`} title={T('Voice', '语音')}><Phone size={13} /></button>
              </div>
              <div className="flex items-center gap-1">
                <button className={`p-1.5 rounded ${t.hover}`} title={T('Slash command', '斜杠命令')}><Slash size={12} /></button>
                <button className={`p-1.5 rounded ${t.hover}`} title={T('Invoke skill', '调用技能')}><AtSign size={12} /></button>
                {streaming ? (
                  <button onClick={() => setStreaming(false)}
                    className="ml-1 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10">
                    <StopCircle size={12} /> {T('Stop', '停止')}
                  </button>
                ) : (
                  <button onClick={handleSend} disabled={!chatInput.trim()}
                    className={`ml-1 p-1.5 rounded-lg ${chatInput.trim() ? 'bg-amber-500 text-neutral-900 hover:bg-amber-400' : t.chip}`}
                    title={T('Send (Enter)', '发送(回车)')}>
                    <Send size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const pages = { overview: Overview, sessions: Sessions, memory: Memory, skills: Skills, platforms: Platforms, tools: Tools, schedules: Schedules };
  const PageEl = view === 'chat' ? null : pages[view];

  return (
    <div className={`${t.bg} ${t.text} min-h-screen`} style={{ fontFamily: zh ? '-apple-system, BlinkMacSystemFont, "Inter", "PingFang SC", "Microsoft YaHei", sans-serif' : '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}>
      <div className="flex h-screen overflow-hidden">
        <aside className={`w-56 border-r ${t.border} flex flex-col shrink-0`}>
          <div className="p-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-neutral-900 font-bold text-lg leading-none">☤</div>
            <div>
              <div className="font-semibold text-sm tracking-tight">Hermes</div>
              <div className={`text-[10px] font-mono ${t.faint}`}>v0.8.0</div>
            </div>
          </div>
          <nav className="flex-1 px-2 py-1 overflow-auto">
            {NAV_SECTIONS.map(section => {
              const items = NAV.filter(n => n.section === section.id);
              if (items.length === 0) return null;
              return (
                <div key={section.id} className="mb-3">
                  <div className={`px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${t.faint}`}>
                    {zh ? section.zh : section.en}
                  </div>
                  <div className="space-y-0.5">
                    {items.map(item => {
                      const Icon = item.icon;
                      const active = view === item.id;
                      return (
                        <button key={item.id} onClick={() => setView(item.id)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors ${active ? `${t.activeBg} ${t.text}` : `${t.dim} ${t.hover}`}`}>
                          <Icon size={14} />
                          <span>{zh ? item.label_zh : item.label_en}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className={`p-3 border-t ${t.border}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">you@local</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Circle size={5} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                  <span className={`text-[10px] ${t.faint}`}>{T('hermes running', 'hermes 运行中')}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <header className={`h-12 border-b ${t.border} px-4 flex items-center justify-between shrink-0`}>
            <div className={`flex items-center gap-2 flex-1 max-w-md px-3 py-1.5 rounded-md border ${t.input}`}>
              <Search size={13} className={t.faint} />
              <input placeholder={T('Search sessions, skills, memory…', '搜索会话、技能、记忆…')} className={`flex-1 bg-transparent text-sm outline-none ${t.text} placeholder:${t.faint}`} />
              <span className={`text-[10px] font-mono ${t.faint} border ${t.chip} px-1 rounded`}>⌘F</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`text-xs ${t.dim} mr-3 flex items-center gap-1.5 px-2 py-1 rounded border ${t.chip}`}>
                <Server size={11} />
                {T('Local · Docker', '本地 · Docker')}
              </div>

              {/* Language selector */}
              <div className="relative">
                <button onClick={() => setLangMenuOpen(o => !o)}
                  className={`p-1.5 rounded-md ${t.hover} flex items-center gap-1`}
                  title={T('Language', '语言')}>
                  <Languages size={14} />
                  <span className="text-[10px] font-medium">{zh ? '中' : 'EN'}</span>
                </button>
                {langMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setLangMenuOpen(false)} />
                    <div className={`absolute top-full right-0 mt-1 w-36 rounded-lg border ${t.border} ${t.cardSolid} shadow-xl z-20 overflow-hidden`}>
                      <div className={`px-3 py-1.5 text-[10px] font-medium ${t.faint} uppercase tracking-wide border-b ${t.borderSoft}`}>
                        {T('Language', '语言')}
                      </div>
                      <button onClick={() => { setLang('en'); setLangMenuOpen(false); }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-sm ${lang === 'en' ? t.activeBg : t.hover}`}>
                        <span>English</span>
                        {lang === 'en' && <Check size={12} className="text-amber-500" />}
                      </button>
                      <button onClick={() => { setLang('zh'); setLangMenuOpen(false); }}
                        className={`w-full px-3 py-1.5 flex items-center justify-between text-sm ${lang === 'zh' ? t.activeBg : t.hover}`}>
                        <span>中文</span>
                        {lang === 'zh' && <Check size={12} className="text-amber-500" />}
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button className={`p-1.5 rounded-md ${t.hover} relative`}>
                <Bell size={14} />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
              </button>
              <button onClick={() => setTheme(dark ? 'light' : 'dark')} className={`p-1.5 rounded-md ${t.hover}`}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <a href="https://github.com/NousResearch/hermes-agent" target="_blank" rel="noreferrer" className={`p-1.5 rounded-md ${t.hover}`}>
                <Github size={14} />
              </a>
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            {view === 'chat' ? <ChatView /> : <div className="h-full overflow-auto"><PageEl /></div>}
          </main>
        </div>
      </div>
    </div>
  );
}
