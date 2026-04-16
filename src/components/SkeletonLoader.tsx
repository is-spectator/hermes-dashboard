import { cn } from '../lib/utils'

interface SkeletonLoaderProps {
  className?: string
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] animate-pulse',
        className
      )}
    />
  )
}
