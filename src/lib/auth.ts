// src/lib/auth.ts
// Minimal session helper used by API routes. Replace with your real auth integration.

type HeadersLike =
  | Headers
  | {
      get(name: string): string | null | undefined
    }

type RequestLike =
  | Request
  | {
      headers?: HeadersLike
    }

export type Session = {
  user: { id: string }
}

const FALLBACK_USER_ID = process.env.DEFAULT_USER_ID || 'default-user'

function extractUserId(headers?: HeadersLike | null): string | null {
  if (!headers) return null
  try {
    if (headers instanceof Headers) {
      return headers.get('x-user-id') ?? headers.get('x-user') ?? null
    }
    const get = headers.get?.bind(headers)
    if (!get) return null
    return get('x-user-id') ?? get('x-user') ?? null
  } catch {
    return null
  }
}

export async function getServerSession(req?: RequestLike, _res?: unknown): Promise<Session | null> {
  const explicit = extractUserId(req && 'headers' in req ? (req as any).headers : undefined)
  const id = explicit || FALLBACK_USER_ID
  if (!id) return null
  return { user: { id } }
}
