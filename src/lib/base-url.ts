const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export function getBaseUrl() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin
  }

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return trimTrailingSlash(process.env.NEXT_PUBLIC_BASE_URL)
  }

  if (process.env.BASE_URL) {
    return trimTrailingSlash(process.env.BASE_URL)
  }

  if (process.env.VERCEL_URL) {
    return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`
  }

  const port = process.env.PORT ?? '3000'
  return `http://localhost:${port}`
}
