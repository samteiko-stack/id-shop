import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <p className="text-8xl font-black text-muted-foreground/20 tracking-tighter leading-none">404</p>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Page not found</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline">Go to Shop</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
