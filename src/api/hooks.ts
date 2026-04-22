import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { ApiError } from '@/api/types';
import type {
  ConfigPartial,
  ConfigResponse,
  DeleteEnvResponse,
  EnvRegistry,
  LogFile,
  LogsResponse,
  PutConfigResponse,
  PutEnvResponse,
  SessionDetail,
  SessionMessagesResponse,
  SessionsListParams,
  SessionsListResponse,
  SkillsResponse,
  StatusResponse,
} from '@/api/types';
import { useAppStore } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';

// ---------------------------------------------------------------------------
// Query keys — first segment is always baseUrl so that setBaseUrl-triggered
// queryClient.clear() buys a clean slate even if a listener forgets to invalidate.
// ---------------------------------------------------------------------------

export const queryKeys = {
  status: (baseUrl: string) => ['status', baseUrl] as const,
  config: (baseUrl: string) => ['config', baseUrl] as const,
  env: (baseUrl: string) => ['env', baseUrl] as const,
  sessions: (baseUrl: string, params?: SessionsListParams) =>
    ['sessions', baseUrl, params ?? {}] as const,
  session: (baseUrl: string, id: string) => ['session', baseUrl, id] as const,
  sessionMessages: (baseUrl: string, id: string) =>
    ['session-messages', baseUrl, id] as const,
  skills: (baseUrl: string) => ['skills', baseUrl] as const,
  logs: (baseUrl: string, file: LogFile) => ['logs', baseUrl, file] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useStatus(): UseQueryResult<StatusResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.status(baseUrl),
    queryFn: () => api.getStatus(),
    refetchInterval: 5_000,
    staleTime: 2_000,
    retry: false,
  });
}

export function useConfig(): UseQueryResult<ConfigResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.config(baseUrl),
    queryFn: () => api.getConfig(),
    retry: false,
  });
}

export function useEnv(): UseQueryResult<EnvRegistry> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.env(baseUrl),
    queryFn: () => api.getEnv(),
    retry: false,
  });
}

export function useSessions(
  params?: SessionsListParams,
): UseQueryResult<SessionsListResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.sessions(baseUrl, params),
    queryFn: () => api.getSessions(params),
    retry: false,
  });
}

export function useSession(id: string | null): UseQueryResult<SessionDetail> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.session(baseUrl, id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('session id is required');
      return api.getSession(id);
    },
    enabled: Boolean(id),
    retry: false,
  });
}

export function useSessionMessages(
  id: string | null,
): UseQueryResult<SessionMessagesResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.sessionMessages(baseUrl, id ?? ''),
    queryFn: () => {
      if (!id) throw new Error('session id is required');
      return api.getSessionMessages(id);
    },
    enabled: Boolean(id),
    retry: false,
  });
}

export function useSkills(): UseQueryResult<SkillsResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.skills(baseUrl),
    queryFn: () => api.getSkills(),
    retry: false,
  });
}

export function useLogs(file: LogFile = 'agent'): UseQueryResult<LogsResponse> {
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useQuery({
    queryKey: queryKeys.logs(baseUrl, file),
    queryFn: () => api.getLogs(file),
    refetchInterval: 2_000,
    staleTime: 1_000,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

function toastFromError(err: unknown): void {
  const toast = useToastStore.getState().push;
  if (err instanceof ApiError) {
    toast({
      level: 'error',
      titleEn: `Request failed (${err.status || 'network'})`,
      titleZh: `请求失败 (${err.status || '网络错误'})`,
      descEn: err.message,
      descZh: err.message,
    });
    return;
  }
  const msg = err instanceof Error ? err.message : 'Unknown error';
  toast({
    level: 'error',
    titleEn: 'Request failed',
    titleZh: '请求失败',
    descEn: msg,
    descZh: msg,
  });
}

export function usePutEnv() {
  const queryClient = useQueryClient();
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useMutation<PutEnvResponse, unknown, { key: string; value: string }>({
    mutationFn: ({ key, value }) => api.putEnv(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.env(baseUrl) });
      useToastStore.getState().push({
        level: 'success',
        titleEn: 'Env updated',
        titleZh: '环境变量已更新',
      });
    },
    onError: toastFromError,
  });
}

export function useDeleteEnv() {
  const queryClient = useQueryClient();
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useMutation<DeleteEnvResponse, unknown, { key: string }>({
    mutationFn: ({ key }) => api.deleteEnv(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.env(baseUrl) });
      useToastStore.getState().push({
        level: 'success',
        titleEn: 'Env removed',
        titleZh: '环境变量已删除',
      });
    },
    onError: toastFromError,
  });
}

export function usePutConfig() {
  const queryClient = useQueryClient();
  const baseUrl = useAppStore((s) => s.baseUrl);
  return useMutation<PutConfigResponse, unknown, ConfigPartial>({
    mutationFn: (partial) => api.putConfig(partial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.config(baseUrl) });
      queryClient.invalidateQueries({ queryKey: queryKeys.status(baseUrl) });
      useToastStore.getState().push({
        level: 'success',
        titleEn: 'Config saved',
        titleZh: '配置已保存',
      });
    },
    onError: toastFromError,
  });
}
