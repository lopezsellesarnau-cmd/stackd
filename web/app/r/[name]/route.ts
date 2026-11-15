// The shadcn registry: /r/{name}.json. Free components are open; paid ones need the buyer's Gumroad
// licence key in the X-License-Key header (several keys can be sent, comma-separated, one per
// purchase). /r/registry.json lists everything.
//   components.json → "registries": { "@stackd": { "url": "https://www.stackd.codes/r/{name}.json",
//                      "headers": { "X-License-Key": "${STACKD_LICENSE_KEY}" } } }
import { REGISTRY } from '@/registry'
import { buyUrl, canGet, keysOf } from '@/lib/licence'

const json = (body: unknown, status = 200, cache = 'public, max-age=300') =>
  Response.json(body, { status, headers: { 'Cache-Control': cache, 'Access-Control-Allow-Origin': '*' } })

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
  if (!entry) return json({ error: 'Not found', message: `No component called "${name}". See https://www.stackd.codes/r/registry.json` }, 404)
  if (entry.free) return json(entry.item)

  const buy = buyUrl(entry)
  const keys = keysOf(req)
  if (!keys.length) {
    return json({ error: 'Unauthorized', message: `${entry.title} is a paid component. Buy it at ${buy}, then put the licence key from your receipt in STACKD_LICENSE_KEY.` }, 401, 'no-store')
  }
  if (await canGet(entry, keys)) return json(entry.item, 200, 'private, no-store')
  return json({ error: 'Forbidden', message: `None of your licence keys is for ${entry.title}. Buy it at ${buy} and add its key to STACKD_LICENSE_KEY (comma-separated).` }, 403, 'no-store')
}
