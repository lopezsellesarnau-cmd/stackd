// Builds the shadcn registry for stackd.codes from the kit sources (~/StackD/kit).
// Run: node scripts/build-registry.mjs   → writes registry/items/*.json and registry/index.ts
// Commit the output: the site serves it from /r/{name}.json (paid items need a Gumroad licence key).
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const KIT = join(homedir(), 'StackD/kit')
const OUT = new URL('../registry/', import.meta.url).pathname
const SITE = process.env.REGISTRY_SITE || 'https://www.stackd.codes'
const BOT = `${SITE}/r/bot.json`

// Gumroad product IDs (the License key block in each product's Content tab shows it). Gumroad
// won't check a key by the product's URL name, only by this ID.
const PRODUCT_IDS = {
  'bot': 'bzHy86jjfJab3ELXoQvJgQ==',
  'prompt-bar': 'ZrrRcXWObVgM2FNdHluTZQ==',
  'slide-to-pay': 'YzT6bqLyMYwc1_JaaR_Nug==',
  'stat-card': 'vEP00WEn2-9US2vOvHBZGg==',
  'notification-stack': 't0QcPKkRHH2MqrtQ4bBmnQ==',
  'split-flap': 'XyoqnEeTlDTBAnxqf3DXrA==',
  'rotary-dial': 'D807pK7tXldTQ8VuJFQixw==',
  'focus-timer': 'xuHVra4-_pdo18Z1yTfXCw==',
  'bot-login': '5BExo_sJ4rjNpMtbGVueIg==',
  'elastic-tabs': 'tAuUcpWm3_kw-5xifCZlww==',
  'bot-feedback': 'PxiuEGTnW01I1Y0slRWywQ==',
  'command-palette': 'MiRiP7fpx9iqw4BE7_nqZg==',
  'file-drop': 'u_bQNmLWx0xw0LUdLTmElA==',
  'bot-loader': 'ECJsUGLh1TwZoYqu2jmgUw==',
  'otp-input': 'X7x02BQyVKbmO0rHKmauWw==',
  'glass-tiles': 'tkjRb3NZZJLtFmBbYwjYxg==',
  'card-swap': 't_IVviwQT5D1x6Riv17gBQ==',
  'before-after': 'mXS8Arj-gdLXde1EQk7ebg==',
}

// name · title · file · free? · Gumroad permalink · uses the Bot? · description
const ITEMS = [
  ['bot', 'Bot', 'Bot.tsx', true, 'stackd', false, 'A round character whose eyes follow the cursor. Four bodies, four kinds of eyes, any colour.'],
  ['prompt-bar', 'AI prompt bar', 'PromptBar.tsx', true, 'prompt_bar', true, 'A prompt bar with attachments, a model menu, a thinking shimmer and a streamed answer. Optional Bot.'],
  ['slide-to-pay', 'Slide to pay', 'SlideToPay.tsx', true, 'slide_to_pay', false, 'Drag to pay: processing, then done.'],
  ['stat-card', 'Live stat card', 'StatCard.tsx', true, 'stat_card', false, 'A number that counts up, a sparkline and a tooltip.'],
  ['notification-stack', 'Notification stack', 'NotificationStack.tsx', true, 'notification_stack', false, 'Notifications that stack, fan out on hover and swipe away.'],
  ['split-flap', 'Split flap', 'SplitFlap.tsx', false, 'split_flap', false, 'Text on flipping split-flap letters, like an old departures board.'],
  ['rotary-dial', 'Rotary dial', 'RotaryDial.tsx', false, 'rotary_dial', false, 'A knob you turn by dragging in a circle, with stepped ticks and a rubbery end.'],
  ['focus-timer', 'Focus timer', 'FocusTimer.tsx', false, 'focus_timer', true, 'A focus timer in a notch that grows into an island, with the Bot.'],
  ['bot-login', 'Bot login', 'BotLogin.tsx', false, 'bot_login', true, 'A sign-in form with the Bot: it reads your email and looks away from your password.'],
  ['elastic-tabs', 'Elastic tabs', 'ElasticTabs.tsx', false, 'Elastictabs', false, 'Tabs whose highlight stretches like elastic between options.'],
  ['bot-feedback', 'Bot feedback', 'BotFeedback.tsx', false, 'feedback', true, 'A rating prompt where the Bot reacts to the score.'],
  ['command-palette', 'Command palette', 'CommandPalette.tsx', false, 'command_palette', true, 'A ⌘K palette with fuzzy search, pages, shortcuts and light and dark themes.'],
  ['file-drop', 'File drop', 'FileDrop.tsx', false, 'file_drop', true, 'A dropzone where the Bot eats your files, with upload progress, retry and limits.'],
  ['bot-loader', 'Bot loader', 'BotLoader.tsx', false, 'bot_loader', true, 'A multi-step loader with the Bot thinking it through.'],
  ['otp-input', 'OTP input', 'OtpInput.tsx', false, 'otp_input', true, 'A one-time code input with paste, resend timer and error states.'],
  ['glass-tiles', 'Glass tiles', 'GlassTiles.tsx', false, 'glass_tiles', true, 'Drag over a picture to cover it with glass tiles, and save it as a PNG.'],
  ['card-swap', 'Card swap', 'CardSwap.tsx', false, 'card_swap', false, 'A stack of pictures in depth you press or fling to the back.'],
  ['before-after', 'Before / after', 'BeforeAfter.tsx', false, 'before_after', false, 'Compare two pictures with a jelly line you drag.'],
]

const read = (f) => {
  const src = readFileSync(join(KIT, 'src/components', f), 'utf8')
  return src.startsWith("'use client'") ? src : `'use client'\n\n${src}`
}
const file = (name, content, extra = {}) => ({ path: `registry/stackd/${name}`, type: 'registry:component', target: `components/stackd/${name}`, content, ...extra })

rmSync(join(OUT, 'items'), { recursive: true, force: true })
mkdirSync(join(OUT, 'items'), { recursive: true })

const index = []
for (const [name, title, f, free, permalink, bot, description] of ITEMS) {
  const files = [file(f, read(f))]
  const item = {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name,
    type: 'registry:component',
    title,
    description,
    author: 'StackD <https://stackd.codes>',
    dependencies: [],
    registryDependencies: bot ? [BOT] : [],
    files,
    meta: { free, price: free ? 0 : 7, gumroad: `https://arnolop.gumroad.com/l/${permalink}` },
  }
  if (name === 'prompt-bar') {
    // The ready Next.js route that streams Claude's answer
    files.push(file('route.ts', readFileSync(join(KIT, 'release/stackd-prompt-bar/app/api/chat/route.ts'), 'utf8'),
      { type: 'registry:file', target: 'app/api/chat/route.ts' }))
    item.dependencies.push('@anthropic-ai/sdk')
  }
  writeFileSync(join(OUT, 'items', `${name}.json`), JSON.stringify(item, null, 2) + '\n')
  index.push({ name, title, description, free, permalink, productId: PRODUCT_IDS[name] ?? '' })
}

// What the route needs: every item, imported statically so the server bundle carries it
const ts = `// Generated by scripts/build-registry.mjs. Don't edit by hand.
${index.map((i, n) => `import i${n} from './items/${i.name}.json'`).join('\n')}

export type RegistryEntry = { name: string; title: string; description: string; free: boolean; permalink: string; productId: string; item: unknown }

export const REGISTRY: Record<string, RegistryEntry> = {
${index.map((i, n) => `  '${i.name}': { name: '${i.name}', title: ${JSON.stringify(i.title)}, description: ${JSON.stringify(i.description)}, free: ${i.free}, permalink: '${i.permalink}', productId: '${i.productId}', item: i${n} },`).join('\n')}
}
`
writeFileSync(join(OUT, 'index.ts'), ts)
console.log(`${index.length} items → registry/items (${index.filter((i) => i.free).length} free)`)
const missing = index.filter((i) => !i.free && !i.productId).map((i) => i.name)
if (missing.length) console.log(`No Gumroad product ID yet (paid installs refused): ${missing.join(', ')}`)
