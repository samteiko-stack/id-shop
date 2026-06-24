import { AuthBrandHeadline, AuthBrandPanel } from '@/components/auth/auth-brand-panel'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      <AuthBrandPanel
        className="lg:w-[420px] xl:w-[480px]"
        footer={`© ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_APP_NAME ?? 'ID Shop'}. Internal use only.`}
      >
        <AuthBrandHeadline
          title="One platform."
          accent="Total control."
          description="Manage products, customers, orders, and traceability in one centralised system — built for medical and dental supply."
        />
      </AuthBrandPanel>

      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center justify-between mb-10 lg:hidden">
            <img src="/logo-blue.png" alt="ID Shop" className="h-7 w-auto" />
            <a href="/shop" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Butiken
            </a>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
