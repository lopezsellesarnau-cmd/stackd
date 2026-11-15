// StackD's MCP server: https://www.stackd.codes/mcp (Streamable HTTP, stateless, JSON replies).
// Lets AI agents (Claude, Codex, Grok, Le Chat…) list the components and get their code.
// Free components are open; paid ones need the buyer's Gumroad licence key(s) as
// "Authorization: Bearer <key>[,<key>…]" (or X-License-Key), the same keys as the shadcn registry.
import { REGISTRY, type RegistryEntry } from '@/registry'
import { buyUrl, canGet, keysOf } from '@/lib/licence'

type Item = { dependencies?: string[]; registryDependencies?: string[]; files: { target: string; content: string }[] }
type RpcId = string | number | null
type Rpc = { jsonrpc: '2.0'; id?: RpcId; method: string; params?: Record<string, unknown> }

const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-License-Key, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

const INSTRUCTIONS = `StackD interface components: React + Tailwind, no other libraries, every state included.
Call list_components to see what exists, then get_component to get the files and where they go.
Write each file at its path, install any npm dependencies listed, and import the component from there.
Paid components need the user's Gumroad licence key, set when the server is added (Authorization: Bearer).`

const TOOLS = [
  {
    name: 'list_components',
    title: 'List StackD components',
    description: 'All StackD components: name, what it does, and whether it is free or paid (with its price and where to buy it).',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_component',
    title: 'Get a StackD component',
    description: 'The code of one component: every file with the path to write it at, plus npm dependencies. Paid components need the licence key the server was added with.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'The component name from list_components, e.g. "card-swap".', enum: Object.keys(REGISTRY) } },
      required: ['name'],
      additionalProperties: false,
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
]

const text = (t: string, isError = false) => ({ content: [{ type: 'text', text: t }], ...(isError ? { isError: true } : {}) })

function listText() {
  const rows = Object.values(REGISTRY).map((e) =>
    `- ${e.name} · ${e.title} · ${e.free ? 'free' : `paid, €7 (${buyUrl(e)})`}\n  ${e.description}`)
  return `${rows.length} StackD components (React + Tailwind):\n\n${rows.join('\n')}\n\nGet one with get_component { "name": "<name>" }.`
}

// The files of an item and, for the ones built on the Bot, the Bot too (its own free item)
function files(entry: RegistryEntry) {
  const item = entry.item as Item
  const out = [...item.files]
  if (item.registryDependencies?.some((d) => d.endsWith('/bot.json'))) out.unshift(...(REGISTRY.bot.item as Item).files)
  return { files: out, deps: item.dependencies ?? [] }
}

async function getText(name: string, keys: string[]) {
  const entry = REGISTRY[name]
  if (!entry) return text(`No component called "${name}". Call list_components to see the names.`, true)
  if (!(await canGet(entry, keys))) {
    return text(keys.length
      ? `None of the licence keys this server was added with is for ${entry.title}. Tell the user it costs €7 at ${buyUrl(entry)}; after buying, they add the key from their receipt to this server's Authorization header (several keys: comma-separated).`
      : `${entry.title} is a paid component (€7). Tell the user to buy it at ${buyUrl(entry)}, then add this MCP server again with the licence key from their receipt as "Authorization: Bearer <key>".`, true)
  }
  const { files: fs, deps } = files(entry)
  const lang = (p: string) => (p.endsWith('.ts') ? 'ts' : 'tsx')
  return text([
    `${entry.title} (StackD). ${entry.description}`,
    `Write these ${fs.length} file(s) at these paths (relative to the project root; keep them in the same folder, they import each other with "./").`,
    deps.length ? `Then install: npm install ${deps.join(' ')}` : 'No npm dependencies beyond React. Needs Tailwind CSS.',
    `Same thing with the shadcn CLI: npx shadcn@latest add ${entry.free ? `https://www.stackd.codes/r/${entry.name}.json` : `@stackd/${entry.name}`}`,
    ...fs.map((f) => `File: ${f.target}\n\`\`\`${lang(f.target)}\n${f.content}\n\`\`\``),
  ].join('\n\n'))
}

async function handle(msg: Rpc, req: Request) {
  const p = msg.params ?? {}
  switch (msg.method) {
    case 'initialize': {
      const asked = String(p.protocolVersion ?? '')
      return {
        protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'stackd', title: 'StackD components', version: '1.0.0', websiteUrl: 'https://stackd.codes' },
        instructions: INSTRUCTIONS,
      }
    }
    case 'ping':
      return {}
    case 'tools/list':
      return { tools: TOOLS }
    case 'tools/call': {
      const args = (p.arguments ?? {}) as Record<string, unknown>
      if (p.name === 'list_components') return text(listText())
      if (p.name === 'get_component') return getText(String(args.name ?? ''), keysOf(req))
      throw { code: -32602, message: `Unknown tool: ${String(p.name)}` }
    }
    default:
      throw { code: -32601, message: `Method not found: ${msg.method}` }
  }
}

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, { status: 400, headers: CORS })
  }
  const msgs = (Array.isArray(body) ? body : [body]) as Rpc[]
  const replies = []
  for (const msg of msgs) {
    if (!msg || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
      replies.push({ jsonrpc: '2.0', id: (msg as Rpc)?.id ?? null, error: { code: -32600, message: 'Invalid request' } })
      continue
    }
    if (msg.id === undefined) continue // a notification (e.g. notifications/initialized): nothing to answer
    try {
      replies.push({ jsonrpc: '2.0', id: msg.id, result: await handle(msg, req) })
    } catch (e) {
      const err = e as { code?: number; message?: string }
      replies.push({ jsonrpc: '2.0', id: msg.id, error: { code: err.code ?? -32603, message: err.message ?? 'Internal error' } })
    }
  }
  if (!replies.length) return new Response(null, { status: 202, headers: CORS })
  return Response.json(Array.isArray(body) ? replies : replies[0], { headers: { ...CORS, 'Cache-Control': 'no-store' } })
}

// No server-to-client stream: this server only answers requests
export function GET() {
  return new Response('Method Not Allowed', { status: 405, headers: { ...CORS, Allow: 'POST' } })
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}
