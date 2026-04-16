import { cn } from '../lib/utils'

interface SkeletonLoaderProps {
  className?: string
}

export default function SkeletonLoader({ className }: SkeletonLoaderProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]',
        className
      )}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
      }}
    />
  )
}
