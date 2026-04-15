import type { NextApiRequest } from 'next'

type JsonBody = Record<string, unknown>

export function parseJsonBody<T extends JsonBody>(req: NextApiRequest): T {
  if (!req.body) {
    return {} as T
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as T
    } catch {
      return {} as T
    }
  }

  return req.body as T
}
