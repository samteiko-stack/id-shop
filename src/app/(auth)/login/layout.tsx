import { authMeta } from '@/lib/metadata'

export const metadata = authMeta.login

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
