import { cn } from '../lib/utils'

interface SkeletonLoaderProps {
  className?: string
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--border-default)] to-[var(--bg-tertiary)]',
        className
      )}
    />
  )
}
