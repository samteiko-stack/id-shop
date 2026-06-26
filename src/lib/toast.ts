import { toast as sonnerToast, type ExternalToast } from 'sonner'

/** Long enough to read multi-line server errors without rushing. */
const ERROR_DURATION_MS = 10_000

export type { ExternalToast } from 'sonner'

function toastFn(
  message: Parameters<typeof sonnerToast>[0],
  data?: Parameters<typeof sonnerToast>[1],
) {
  return sonnerToast(message, data)
}

export const toast = Object.assign(toastFn, sonnerToast) as typeof sonnerToast

toast.error = (message, data) => {
  const id = data?.id ?? (typeof message === 'string' ? `error:${message}` : undefined)
  return sonnerToast.error(message, { duration: ERROR_DURATION_MS, id, ...data })
}
