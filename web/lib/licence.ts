// Gumroad licence keys: one per purchase, checked against the product's Gumroad ID.
// Shared by the shadcn registry (/r) and the MCP server (/mcp).
import type { RegistryEntry } from '@/registry'

// A key that passed stays good for a while, so several installs don't call Gumroad each time
const passed = new Map<string, number>()
const TTL = 10 * 60 * 1000

async function owns(productId: string, key: string) {
  if (!productId) return false
  const memo = `${productId}:${key}`
  if ((passed.get(memo) ?? 0) > Date.now()) return true
  try {
    const res = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      body: new URLSearchParams({ product_id: productId, license_key: key, increment_uses_count: 'false' }),
      cache: 'no-store',
    })
    const data = await res.json()
    const p = data?.purchase
    const ok = data?.success === true && p && !p.refunded && !p.chargebacked && !p.disputed
    if (ok) passed.set(memo, Date.now() + TTL)
    return ok
  } catch {
    return false
  }
}

/** The keys a request carries: X-License-Key, Authorization: Bearer, or ?key=. Comma-separated, at most 20. */
export function keysOf(req: Request) {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const raw = req.headers.get('x-license-key') ?? bearer ?? new URL(req.url).searchParams.get('key') ?? ''
  return raw.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 20)
}

/** Free, or one of the keys is for this product */
export async function canGet(entry: RegistryEntry, keys: string[]) {
  if (entry.free) return true
  for (const key of keys) if (await owns(entry.productId, key)) return true
  return false
}

export const buyUrl = (entry: RegistryEntry) => `https://arnolop.gumroad.com/l/${entry.permalink}`
