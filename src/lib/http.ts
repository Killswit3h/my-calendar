export class ApiError extends Error {
  status: number
  bodyText: string
  bodyJson?: unknown

  constructor(status: number, bodyText: string, bodyJson?: unknown, message?: string) {
    super(
      message ||
        (typeof bodyJson === 'object' && bodyJson && 'error' in bodyJson && typeof (bodyJson as any).error === 'string'
          ? (bodyJson as any).error
          : bodyText || `Request failed with status ${status}`),
    )
    this.name = 'ApiError'
    this.status = status
    this.bodyText = bodyText
    this.bodyJson = bodyJson
  }
}

export async function api<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }

  const res = await fetch(input, { ...init, headers })
  if (!res.ok) {
    const bodyText = await res.text()
    let bodyJson: unknown
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : undefined
    } catch {
      // ignore parse failure
    }
    throw Object.assign(new ApiError(res.status, bodyText, bodyJson), {
      status: res.status,
      body: bodyJson,
    })
  }

  return res.json()
}
