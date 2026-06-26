import { authMeta, withNoIndex } from '@/lib/metadata'

export const metadata = withNoIndex(authMeta.resetPassword)

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
