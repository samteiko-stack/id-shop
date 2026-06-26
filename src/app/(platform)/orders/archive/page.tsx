import { redirect } from 'next/navigation'

export default async function ArchivedOrdersRedirect({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string }>
}) {
  const { page, pageSize } = await searchParams
  const params = new URLSearchParams({ type: 'sales' })
  if (page) params.set('page', page)
  if (pageSize) params.set('pageSize', pageSize)
  redirect(`/archive?${params.toString()}`)
}
