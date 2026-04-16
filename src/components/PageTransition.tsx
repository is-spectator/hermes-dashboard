import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()

  return (
    <div
      key={location.pathname}
      className="animate-[fade-in-up_150ms_ease-out]"
    >
      {children}
    </div>
  )
}
