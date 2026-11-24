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
  'voice-memo': 'KQ5LKMi3cWlU8zeGLcJSrw==',
  'world-clock': 'oZB-kMoA9s9FHR1OVBt9jA==',
  'pull-to-refresh': 'KdQFp1EexriX3AE6BTmvAg==',
  'activity-grid': '3J1jvqKnMaXtEk5IJ2JZvg==',
  'toast': 'vUsBWXKOe-heq2HA_YxDnQ==',
  'heat-word': 'ZZjiFSRtYaW3cWsEf0eUfA==',
  'spending-ring': 'y_mnOO1ID-gm0Gx9h7l79Q==',
  'stacked-bars': 's7G0V5flmtu8BinO58qBCw==',
  'dot-morph': 'uKNTGhIuHfZ-S1pmZ4d_-g==',
  'squeeze-button': 'AZH4eLIUQ8Hbc3Pq3EE_Xw==',
  'split-list': 'VSWiXBQ5OEKkQZ3J-CV4Tg==',
  'tape-measure': 'YiETVHiVxun_efJnAYniMA==',
  'label-maker': 'JQKZ30hBtiRAFGFSFnLk6A==',
  'ascii-bot': 'sJvuuap0SAxc3iMaOMfE5A==',
  'radial-menu': '-s4xg9UOsOxt3ZEZf4xdWg==',
  generate: 'eaZAXVCCrSfLjCPEdFyyNA==',
  'image-accordion': 'FuQEX7Y8ljC2y2j7ryCI3Q==',
  'hex-performance': 'FgdZBFfq9LKzOZXJBv-8kg==',
  'hero-card': '-lTUBbHNWxHxJdPY1Ucmgg==',
  'workflow-canvas': 'jVZQ7y-3pkZK2q0gbpUfJA==',
}

// Release folders named differently from the registry (kit/release/stackd-<folder>)
const RELEASE_DIR = { 'activity-grid': 'activity' }

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
  ['voice-memo', 'Voice memo', 'VoiceMemo.tsx', false, 'voice_memo', true, 'Trim a voice note. The Bot says it, and Save sends a ring of light through the card.'],
  ['world-clock', 'World clock', 'WorldClock.tsx', false, 'world_clock', false, 'A clock per city. Drag one minute hand and every clock turns with it, to find a time that works for everyone.'],
  ['pull-to-refresh', 'Pull to refresh', 'PullToRefresh.tsx', false, 'pull_to_refresh', true, 'Pull a list down and a strand of ink snaps into the Bot, which turns round while your refresh runs.'],
  ['activity-grid', 'Activity', 'ActivityGrid.tsx', false, 'activity', false, 'A grid of days, darker for busier ones, with a lens under the cursor. Switch to 3D and every day rises into a bar.'],
  ['toast', 'Toast', 'Toast.tsx', false, 'toast', true, 'Every toast is the Bot: a drop of ink that unrolls into a pill. Olive when saved, Wine when it fails, turning while a promise runs.'],
  ['heat-word', 'Heat word', 'HeatWord.tsx', false, 'heat_word', false, 'A word in solid ink that melts under the cursor: strokes swell, fuse and glow. Or the Bot, or dots.'],
  ['spending-ring', 'Spending ring', 'SpendingRing.tsx', false, 'spending_ring', false, 'Where the money went, as a ring of liquid ink pills. Hover to read one, tap to leave it out and the ring flows closed.'],
  ['stacked-bars', 'Stacked bars', 'StackedBars.tsx', false, 'ptmot', false, 'A traffic card with a stacked bar per day. Run along it and the column opens to show the breakdown. Day / Week regrows the bars in a wave.'],
  ['dot-morph', 'Dot morph', 'DotMorph.tsx', false, 'dot_morph', false, 'A swarm of dots that holds a shape. The cursor stirs it, a tap spins a whirlpool and the dots curl into the next shape.'],
  ['squeeze-button', 'Squeeze button', 'SqueezeButton.tsx', true, 'squeeze_button', true, 'Words in ink blocks that squeeze each other on hover; click and they slide into one block with the Bot saying Sent.'],
  ['split-list', 'Split list', 'SplitList.tsx', true, 'split_list', false, 'A list split down the middle that parts around the cursor like a lens and turns bold there.'],
  ['tape-measure', 'Tape measure', 'TapeMeasure.tsx', true, 'tape_measure', true, 'A slider you pull like a real tape measure: it whips back when you let go, or stays with the lock on. The Bot is the hub.'],
  ['label-maker', 'Label maker', 'LabelMaker.tsx', true, 'label_maker', true, 'A tag input that works like a label maker: each letter is punched into ink tape, Enter cuts the label and it drops onto the row as a tag.'],
  ['ascii-bot', 'ASCII Bot', 'AsciiBot.tsx', true, 'ascii_bot', true, 'The Bot as a halftone of ink dots that turn into characters under the cursor and cool back along the trail.'],
  ['radial-menu', 'Radial menu', 'RadialMenu.tsx', true, 'radial_menu', true, 'A round menu cut like a citrus around the Bot: segments fill like jelly when pointed at and open into their own rings.'],
  ['generate', 'Generate', 'Generate.tsx', true, 'generate', true, 'A picture forming like a generated image, with the Bot as the loader in the pill; a failure dries the haze into ink dots.'],
  ['image-accordion', 'Image accordion', 'ImageAccordion.tsx', true, 'image_accordion', false, 'Pictures that share one fixed frame: the one you point at opens on a jelly spring and the rest give up the room. Grid, rows or columns.'],
  ['hex-performance', 'Hex performance', 'HexPerformance.tsx', true, 'hex_performance', false, 'A honeycomb heatmap card for dashboards: hexagons with soft corners, a jelly legend that lights one stat, and spongy motion.'],
  ['hero-card', 'Hero card', 'HeroCard.tsx', true, 'hero_card', false, 'A mobile hero with a living picture: a breathing halo, a pixel gradient that sharpens where you touch, or colour behind reeded glass.'],
  ['workflow-canvas', 'Workflow canvas', 'WorkflowCanvas.tsx', true, 'workflow_canvas', true, 'An automation canvas: drag nodes on jelly wires, press Run and the Bot rides them from node to node; conditions branch green or red.'],
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
  // The README from the release zip: how to use it and every prop (the MCP server sends it to agents)
  const readme = readFileSync(join(KIT, 'release', `stackd-${RELEASE_DIR[name] ?? name}`, 'README.md'), 'utf8')
  index.push({ name, title, description, free, permalink, productId: PRODUCT_IDS[name] ?? '', readme })
}

// What the route needs: every item, imported statically so the server bundle carries it
const ts = `// Generated by scripts/build-registry.mjs. Don't edit by hand.
${index.map((i, n) => `import i${n} from './items/${i.name}.json'`).join('\n')}

export type RegistryEntry = { name: string; title: string; description: string; free: boolean; permalink: string; productId: string; readme: string; item: unknown }

export const REGISTRY: Record<string, RegistryEntry> = {
${index.map((i, n) => `  '${i.name}': { name: '${i.name}', title: ${JSON.stringify(i.title)}, description: ${JSON.stringify(i.description)}, free: ${i.free}, permalink: '${i.permalink}', productId: '${i.productId}', readme: ${JSON.stringify(i.readme)}, item: i${n} },`).join('\n')}
}
`
writeFileSync(join(OUT, 'index.ts'), ts)
console.log(`${index.length} items → registry/items (${index.filter((i) => i.free).length} free)`)
const missing = index.filter((i) => !i.free && !i.productId).map((i) => i.name)
if (missing.length) console.log(`No Gumroad product ID yet (paid installs refused): ${missing.join(', ')}`)
