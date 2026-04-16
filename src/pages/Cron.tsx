import { useState } from 'react'
import { Plus, Play, Pause, Trash2, Edit2, X } from 'lucide-react'
import DataTable, { type Column } from '../components/DataTable'
import Badge from '../components/Badge'
import Button from '../components/Button'
import { formatRelativeTime } from '../lib/utils'

interface CronJob {
  id: string
  name: string
  schedule: string
  schedule_human: string
  target_platform: string
  status: 'active' | 'paused' | 'error'
  last_run: string | null
  next_run: string | null
  prompt: string
}

const mockCronJobs: CronJob[] = [
  { id: '1', name: 'Daily Digest', schedule: '0 9 * * *', schedule_human: 'Every day at 9:00 AM', target_platform: 'Telegram', status: 'active', last_run: '2026-04-16T09:00:00Z', next_run: '2026-04-17T09:00:00Z', prompt: 'Generate a summary of yesterday\'s activities and send it to the Telegram channel.' },
  { id: '2', name: 'Weekly Report', schedule: '0 10 * * 1', schedule_human: 'Every Monday at 10:00 AM', target_platform: 'Slack', status: 'active', last_run: '2026-04-14T10:00:00Z', next_run: '2026-04-21T10:00:00Z', prompt: 'Compile weekly metrics and post to #reports channel.' },
  { id: '3', name: 'Health Check', schedule: '*/30 * * * *', schedule_human: 'Every 30 minutes', target_platform: 'CLI', status: 'active', last_run: '2026-04-16T09:30:00Z', next_run: '2026-04-16T10:00:00Z', prompt: 'Check all gateway connections and API endpoint health.' },
  { id: '4', name: 'DB Backup', schedule: '0 2 * * *', schedule_human: 'Every day at 2:00 AM', target_platform: 'CLI', status: 'paused', last_run: '2026-04-15T02:00:00Z', next_run: null, prompt: 'Run database backup and upload to S3.' },
  { id: '5', name: 'Log Cleanup', schedule: '0 3 * * 0', schedule_human: 'Every Sunday at 3:00 AM', target_platform: 'CLI', status: 'error', last_run: '2026-04-13T03:00:00Z', next_run: '2026-04-20T03:00:00Z', prompt: 'Clean up log files older than 30 days.' },
]

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  active: 'success',
  paused: 'warning',
  error: 'danger',
}

export default function Cron() {
  const [showModal, setShowModal] = useState(false)
  const [editJob, setEditJob] = useState<CronJob | null>(null)
  const [form, setForm] = useState({ name: '', schedule: '', target_platform: '', prompt: '' })

  const openCreate = () => {
    setEditJob(null)
    setForm({ name: '', schedule: '', target_platform: '', prompt: '' })
    setShowModal(true)
  }

  const openEdit = (job: CronJob) => {
    setEditJob(job)
    setForm({ name: job.name, schedule: job.schedule, target_platform: job.target_platform, prompt: job.prompt })
    setShowModal(true)
  }

  const columns: Column<CronJob>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
    {
      key: 'schedule',
      header: 'Schedule',
      render: (row) => (
        <div>
          <span className="text-xs font-[var(--font-mono)] text-[var(--text-muted)]">{row.schedule}</span>
          <div className="text-[10px] text-[var(--text-secondary)]">{row.schedule_human}</div>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      width: '100px',
      render: (row) => <span className="text-xs">{row.target_platform}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '90px',
      render: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'last_run',
      header: 'Last Run',
      width: '110px',
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{row.last_run ? formatRelativeTime(row.last_run) : '—'}</span>,
    },
    {
      key: 'next_run',
      header: 'Next Run',
      width: '110px',
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{row.next_run ? formatRelativeTime(row.next_run) : '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--bg-tertiary)] transition-colors" title="Run now">
            <Play size={14} />
          </button>
          <button
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--warning)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title={row.status === 'paused' ? 'Resume' : 'Pause'}
          >
            <Pause size={14} />
          </button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors" title="Edit">
            <Edit2 size={14} />
          </button>
          <button className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-tertiary)] transition-colors" title="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{mockCronJobs.length} scheduled tasks</p>
        <Button onClick={openCreate}><Plus size={14} /> Create Task</Button>
      </div>

      <DataTable
        columns={columns}
        data={mockCronJobs}
        rowKey={(row) => row.id}
        emptyMessage="No cron jobs configured"
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{editJob ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Schedule (cron expression)</label>
                <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="0 9 * * *" className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm font-[var(--font-mono)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Target Platform</label>
                <input value={form.target_platform} onChange={(e) => setForm({ ...form, target_platform: e.target.value })} placeholder="Telegram, Slack, CLI..." className="w-full h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1.5">Prompt</label>
                <textarea value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={() => setShowModal(false)}>{editJob ? 'Save' : 'Create'}</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
