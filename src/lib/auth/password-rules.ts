export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Lösenordet måste ha minst 8 tecken.'
  if (!/[A-Z]/.test(password)) return 'Lösenordet måste innehålla minst en versal.'
  if (!/[a-z]/.test(password)) return 'Lösenordet måste innehålla minst en gemen.'
  if (!/[0-9]/.test(password)) return 'Lösenordet måste innehålla minst en siffra.'
  return null
}
