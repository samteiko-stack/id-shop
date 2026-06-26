import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  maxWidth?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  className?: string
}

const maxWidthClasses = {
  none: '',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
}

export function PageContainer({ children, maxWidth = 'none', className }: PageContainerProps) {
  return (
    <div className={cn('space-y-6', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}
