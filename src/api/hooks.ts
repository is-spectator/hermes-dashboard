import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { CronJob } from './types'

// Status
export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: api.getStatus,
    refetchInterval: 15_000,
  })
}

// Config
export function useConfig() {
  return useQuery({ queryKey: ['config'], queryFn: api.getConfig })
}

export function useUpdateConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}

// Env / Keys
export function useEnv() {
  return useQuery({ queryKey: ['env'], queryFn: api.getEnv })
}

export function useUpdateEnv() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.updateEnv,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['env'] }),
  })
}

// Sessions
export function useSessions(params?: { search?: string; source?: string }) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => api.getSessions(params),
  })
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => api.getSession(id),
    enabled: !!id,
  })
}

// Skills
export function useSkills() {
  return useQuery({ queryKey: ['skills'], queryFn: api.getSkills })
}

// Logs
export function useLogs(params?: { level?: string; search?: string; limit?: number }) {
  return useQuery({
    queryKey: ['logs', params],
    queryFn: () => api.getLogs(params),
    refetchInterval: 5_000,
  })
}

// Cron
export function useCronJobs() {
  return useQuery({ queryKey: ['cron'], queryFn: api.getCronJobs })
}

export function useCreateCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (job: Omit<CronJob, 'id' | 'last_run' | 'next_run'>) => api.createCronJob(job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cron'] }),
  })
}

export function useUpdateCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...job }: Partial<CronJob> & { id: string }) => api.updateCronJob(id, job),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cron'] }),
  })
}

export function useDeleteCronJob() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteCronJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cron'] }),
  })
}

// Gateways
export function useGateways() {
  return useQuery({
    queryKey: ['gateways'],
    queryFn: api.getGateways,
    refetchInterval: 30_000,
  })
}
