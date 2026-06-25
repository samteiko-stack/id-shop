import { authMeta } from '@/lib/metadata'

export const metadata = authMeta.resetPassword

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
