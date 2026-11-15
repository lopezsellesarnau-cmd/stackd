// The shadcn registry: /r/{name}.json. Free components are open; paid ones need the buyer's Gumroad
// licence key in the X-License-Key header (several keys can be sent, comma-separated, one per
// purchase). /r/registry.json lists everything.
//   components.json → "registries": { "@stackd": { "url": "https://stackd.codes/r/{name}.json",
//                      "headers": { "X-License-Key": "${STACKD_LICENSE_KEY}" } } }
import { REGISTRY } from '@/registry'

const json = (body: unknown, status = 200, cache = 'public, max-age=300') =>
  Response.json(body, { status, headers: { 'Cache-Control': cache, 'Access-Control-Allow-Origin': '*' } })

// A key that passed stays good for a while, so installing several items doesn't call Gumroad each time
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

export async function GET(req: Request, { params }: { params: { name: string } }) {
  const name = params.name.replace(/\.json$/, '')

  if (name === 'registry') {
    return json({
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'stackd',
      homepage: 'https://stackd.codes',
      items: Object.values(REGISTRY).map(({ name, title, description, free, permalink }) => ({
        name, type: 'registry:component', title, description,
        meta: { free, price: free ? 0 : 7, gumroad: `https://arnolop.gumroad.com/l/${permalink}` },
      })),
    })
  }

  const entry = REGISTRY[name]
  if (!entry) return json({ error: 'Not found', message: `No component called "${name}". See https://stackd.codes/r/registry.json` }, 404)
  if (entry.free) return json(entry.item)

  const buy = `https://arnolop.gumroad.com/l/${entry.permalink}`
  const keys = (req.headers.get('x-license-key') ?? new URL(req.url).searchParams.get('key') ?? '')
    .split(',').map((k) => k.trim()).filter(Boolean).slice(0, 20)
  if (!keys.length) {
    return json({ error: 'Unauthorized', message: `${entry.title} is a paid component. Buy it at ${buy}, then put the licence key from your receipt in STACKD_LICENSE_KEY.` }, 401, 'no-store')
  }
  for (const key of keys) if (await owns(entry.productId, key)) return json(entry.item, 200, 'private, no-store')
  return json({ error: 'Forbidden', message: `None of your licence keys is for ${entry.title}. Buy it at ${buy} and add its key to STACKD_LICENSE_KEY (comma-separated).` }, 403, 'no-store')
}
