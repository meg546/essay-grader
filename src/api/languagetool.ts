export interface LTMatch {
  message: string
  shortMessage: string
  offset: number
  length: number
  replacements: Array<{ value: string }>
  rule: {
    id: string
    issueType: string
    category: { id: string; name: string }
  }
}

export interface LTResponse {
  matches: LTMatch[]
}

const LT_PUBLIC = 'https://api.languagetool.org/v2/check'
const LT_PROXY = '/api/languagetool/check'

const RETRY_DELAYS_MS = [10_000, 20_000, 40_000]

async function _checkText(
  text: string,
  endpoint: string,
  retryCount: number
): Promise<LTMatch[]> {
  const body = new URLSearchParams({ text, language: 'auto' })

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    // Network/CORS error — caller handles fallback
    throw new Error('NETWORK_ERROR')
  }

  if (res.status === 429) {
    if (retryCount < RETRY_DELAYS_MS.length) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[retryCount]))
      return _checkText(text, endpoint, retryCount + 1)
    }
    // Exhausted retries
    return []
  }

  if (!res.ok) {
    return []
  }

  const data = (await res.json()) as LTResponse
  return data.matches
}

export async function checkText(text: string): Promise<LTMatch[]> {
  try {
    return await _checkText(text, LT_PUBLIC, 0)
  } catch {
    // CORS/network error — fall back to FastAPI proxy
    try {
      return await _checkText(text, LT_PROXY, 0)
    } catch {
      // Proxy also failed — return silently
      return []
    }
  }
}
