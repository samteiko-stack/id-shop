import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from '@/lib/auth/permissions'
import { RoleProvider } from '@/components/auth/role-provider'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { PageTransition } from '@/components/layout/page-transition'
import { Toaster } from '@/components/ui/sonner'
import { SessionTimeoutGuard } from '@/components/auth/session-timeout-guard'
import type { UserRole } from '@/types'

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

  let role: UserRole = 'admin'

  if (!devBypass) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const auth = await getCurrentUserRole()
    if ('error' in auth) redirect('/login')
    role = auth.role
  }

  return (
    <RoleProvider role={role}>
      <div className="platform-shell flex h-dvh overflow-hidden bg-background">
        <SessionTimeoutGuard redirectTo="/login" />
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-6 py-10">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <Toaster position="bottom-right" richColors />
      </div>
    </RoleProvider>
  )
}
