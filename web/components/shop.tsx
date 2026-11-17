'use client'

/**
 * StackD Components: the shop (10 nov 2026).
 * Full screen: a filter panel on the left, and a 4-column grid of rounded tiles with empty
 * cells between them (Flow reference). Each tile is a live component you can try before
 * opening it. On a phone: the filters scroll across the top and the tiles are a full-width list.
 * Its own type, system sans in sentence case, not the editorial mono of the old studio page.
 * Since 10 nov 2026 this shop is the whole of stackd.codes; the developer side lives on arnau-lopez.com.
 * The dark tiles are stand-ins until there are more components.
 */

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Bot, EYES, SHAPES, type BotEyes, type BotShape } from './kit/bot'
import { PromptBar } from './kit/prompt-bar'
import { SlideToPay } from './kit/slide-to-pay'
import { StatCard } from './kit/stat-card'
import { NotificationStack, type Note } from './kit/notification-stack'
import { SplitFlap } from './kit/split-flap'
import { RotaryDial } from './kit/rotary-dial'
import { FocusTimer } from './kit/focus-timer'
import { BotLogin } from './kit/bot-login'
import { ElasticTabs } from './kit/elastic-tabs'
import { BotFeedback } from './kit/bot-feedback'
import { CommandPalette, type CommandItem } from './kit/command-palette'
import { FileDrop, type SampleFile } from './kit/file-drop'
import { BotLoader, type LoaderStep } from './kit/bot-loader'
import { OtpInput } from './kit/otp-input'
import { GlassTiles } from './kit/glass-tiles'
import { CardSwap, type SwapCard } from './kit/card-swap'
import { BeforeAfter } from './kit/before-after'
import { VoiceMemo } from './kit/voice-memo'
import { WorldClock } from './kit/world-clock'
import { PullFeed } from './pull-feed'
import { ActivityGrid } from './kit/activity-grid'
import { useLanguage } from './language-context'

const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "Helvetica Neue", Arial, sans-serif'

const COPY = {
  en: {
    title: 'Components',
    intro: 'Interface components with the Figma file and the React code. Try them right here.',
    categories: 'Categories',
    all: 'All',
    free: 'Free',
    soon: 'Coming soon',
    by: 'Made by Arnau López',
    open: 'Open',
    close: 'Close',
    shape: 'Shape',
    eyes: 'Eyes',
    color: 'Colour',
    botAbout: 'A bot whose eyes follow the cursor. The eyes sit on a sphere, so it looks round as it turns. Four shapes, four kinds of eyes, any colour.',
    includes: ['Figma file with every pose', 'React + Tailwind code, no other libraries', 'Respects reduced motion'],
    promptAbout: 'A chat input for AI products. It grows as you write, takes files, lets you pick a model, shows a thinking shimmer and streams the answer. The Bot can sit beside it as the assistant\'s face. Try it here.',
    promptIncludes: ['Figma file, desktop and mobile', 'React + Tailwind code, with the Bot', 'Works with any AI: Claude, GPT, your own', 'A ready /api/chat route for Next.js'],
    payAbout: 'A slide-to-confirm button for checkouts. Drag the handle to the end: it locks, shows a spinner while your payment runs, then fills and ticks. Let go early and it springs back. If the payment fails it shakes and resets.',
    payIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Works with mouse, touch and keyboard', 'Plug in any payment with one promise'],
    statAbout: 'A stat card for dashboards. The number counts up and the line draws itself in. Run along the line and the number follows you. In live mode a new point arrives and the old line flows into the new one.',
    statIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Works with mouse, touch and keyboard', 'Plug in your own data, or a live feed'],
    live: 'Live',
    notifyAbout: 'A stack of notifications. The newest sits in front and the older ones peek out behind. Hover and the pile opens into a list. Swipe one sideways to dismiss it, or let it close by itself.',
    notifyIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Swipe, tap, mouse and keyboard', 'White and black versions'],
    notify: 'Notify',
    flapAbout: 'Text on little tiles that flip like an old departure board. Each tile runs through the letters on its way to the new one, and the change rolls across the board. For prices, counters, launch dates and headlines. Type to try it.',
    flapIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Letters, numbers, €, $, £ and punctuation', 'White and black versions'],
    typeHere: 'Type something',
    loginAbout: 'A sign-in card with the Bot. It follows your cursor, reads along as you type your email, turns away while you type the password and peeks if you show it. It smiles when you are in and shakes its head when the password is wrong. Try it: the password is stackd.',
    loginIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Works with any sign-in: return true or false', 'Keyboard, screen readers and password managers'],
    timerAbout: 'A focus timer with the Bot. A small pill that opens into a panel as one smooth object: the Bot grows into the corner, the time travels beside it and the ticks arrive last. The Bot watches the time, follows your cursor and smiles when you are done. Comes as a phone island and as a laptop notch that opens on hover.',
    timerIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Island and laptop notch versions', 'Mouse, touch and keyboard'],
    tabsAbout: 'Tabs with an indicator that moves like a drop. The front edge leaves first and the back one catches up, so it stretches on the way and lands with a small wobble. Grab it and drag: it follows your finger, gives like rubber at the ends and drops on the nearest tab. The text changes colour right at its edge.',
    tabsIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Mouse, touch and keyboard, works with screen readers', 'Labels, icons or both, any colour'],
    show: 'Show',
    labels: 'Labels',
    feedbackAbout: 'A rating card with the Bot. Move along the 1 to 5 scale and its face changes with you: droopy eyes on a 1, smiling on a 4, a happy jump on a 5. Pick a number and a comment box opens with the right question. Send it and the Bot thanks you.',
    feedbackIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Works with any backend: one onSubmit', 'Mouse, touch and keyboard, works with screen readers'],
    paletteAbout: 'The ⌘K menu. Type a few letters and it finds the command, even out of order: "nwprj" gets you New project. Commands come in groups, with your recent ones on top, and some open a page of their own. The Bot is the search icon: it watches the row you are on, looks sad when nothing matches and smiles when a command runs. Try it, and press ⌘K.',
    paletteIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Keyboard first, works with screen readers', 'As a pop-up on ⌘K or inline, any colour'],
    pressK: 'Open as a pop-up · ⌘K',
    dropAbout: 'A file dropzone with the Bot. Bring a file near and it opens its mouth; let go and the file is pulled in, the Bot chews, and the upload appears below with a rolling percentage. Images get a thumbnail. Too big? It shakes its head, and if you keep trying it starts answering back. Try the files on the tray.',
    loaderAbout: 'A loader where the Bot does the work you are waiting for. Each step says what it is: the Bot reads (its eyes scan line by line), thinks (it looks up) or works (it looks down and chews). The step shimmers, a bar fills step by step and a list ticks them off. Done: a happy hop. Error: a frown and Retry. Also as a small inline pill.',
    loaderIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Exact progress or a moving sheen', 'Card and inline pill, works with screen readers'],
    progressLabel: 'Progress',
    known: 'Known',
    otpAbout: 'A one-time code input with the Bot. Its eyes follow the box you are typing in, and a pasted code drops in digit by digit. When the last box is filled it checks by itself while the boxes ripple. Right: the boxes turn green and the Bot is happy. Wrong: the row shakes and the Bot looks a little sadder each time. Try 482913.',
    otpIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Paste, phone autofill and screen readers', 'Any length, digits or letters, resend countdown'],
    codeLabel: 'Code',
    digits: 'Digits',
    dots: 'Dots',
    tryCode: 'Try 482913',
    glassAbout: 'Drag over a picture to cover parts of it with glass. Every tile is its own pane: frosted, a lens magnifying a nearby spot, a mirror or a smear, so it reads as glass and not as a grey box. Tiles pop in on a spring; start on glass and you clear it. Save the result as a PNG. Try it on the picture.',
    glassIncludes: ['Figma file with the tiles and examples', 'React + Tailwind code, no other libraries', 'Mouse, touch and keyboard', 'Peek, clear and save as PNG (optional toolbar with the Bot)'],
    glassLabel: 'Glass',
    swapAbout: 'A stack of pictures in depth, each card a step further back and slanted. Press the front card, or drag and fling it, and it goes to the back while the rest step forward; a short drag springs back. It can also swap by itself every few seconds, and stops while you are on it.',
    swapIncludes: ['Figma file with the stack and the cards', 'React + Tailwind code, no other libraries', 'Press, drag and fling, keyboard and screen readers', 'Your own cards, size, step and slant, auto-swap'],
    pillsLabel: 'Titles',
    compareAbout: 'Two pictures split by a line you drag. The line is jelly: the point you hold follows your hand and the ends trail behind, so a quick drag bends it and it wobbles a little as it settles. The edge of the picture bends with it. Press anywhere to jump there.',
    activityAbout: 'A grid of days, darker for busier ones. Move over it and the days near the cursor lift toward you like under a lens. Switch to 3D and the grid tilts back while every day grows into a bar of its real height, one week after another. Drag to turn it.',
    activityIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Your own data: any dates, any unit', 'Flat and 3D, mouse, touch and keyboard'],
    viewLabel: 'View',
    flat: 'Flat',
    colourLabel: 'Colour',
    pullAbout: 'Pull the list down and a strand of ink stretches under your finger, following you left and right. Past the line it snaps and the drop opens its eyes: the Bot. It turns round while your refresh runs, smiles when it is done and is sucked back up. Works with the trackpad, the mouse and touch.',
    pullIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Trackpad, mouse and touch', 'Wraps any list: you give it the refresh'],
    pullHint: 'Pull the list down',
    clockAbout: 'A clock for each city. Drag the minute hand of any clock and all of them turn together, so you can find a time that works for everyone. Let go and it glides to the nearest quarter hour. When every city is at work, a small sign says so. Now springs back to the live time.',
    clockIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Real time zones and summer time, any cities', 'White, black, or day and night per city'],
    panelsLabel: 'Panels',
    dayNight: 'Day / night',
    memoAbout: 'A voice note you trim. Drag the two handles: the part you leave out shrinks into dots, and when you let go near a pause the handle glides into it, so you never cut a word in half. Press play and the Bot says the memo. Save sends a ring of light through the card.',
    memoIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Reads any audio file: waveform and pauses', 'Mouse, touch and keyboard, works with screen readers'],
    compareIncludes: ['Figma file with the slider and its states', 'React + Tailwind code, no other libraries', 'Mouse, touch and keyboard, works with screen readers', 'Your own pictures and labels, any size, how much it bends'],
    lineLabel: 'Line',
    jellyLabel: 'Jelly',
    autoLabel: 'Auto',
    tilesLabel: 'Tiles',
    soft: 'Soft',
    thick: 'Thick',
    small: 'Small',
    large: 'Large',
    unknown: 'Unknown',
    dropIncludes: ['Figma file with every state', 'React + Tailwind code, with the Bot', 'Drop, click, paste, keyboard and screen readers', 'Plug in any upload: progress, cancel and retry'],
    icons: 'Icons',
    shapeLabel: 'Shape',
    hoverNotch: 'Hover the notch',
    notch: 'Notch',
    island: 'Island',
    dialAbout: 'A knob you turn by dragging in a circle. It follows your finger smoothly while the value and the ring of ticks move in steps, then clicks into place with a small bounce. Past either end it gives a little, like rubber. Turn it.',
    dialIncludes: ['Figma file with every state', 'React + Tailwind code, no other libraries', 'Mouse, touch and keyboard, works with screen readers', 'Any range, step, label and colour'],
    buy: 'Buy',
    autoClose: 'Auto-close',
    theme: 'Card',
    light: 'White',
    darkT: 'Black',
    bot: 'Bot',
    on: 'On',
    off: 'Off',
    soonGet: 'Coming soon',
    get: 'Get it free',
    emailNote: 'Checkout on Gumroad. The Figma file and the code arrive in your inbox.',
    install: 'Install with shadcn',
    copy: 'Copy',
    copied: 'Copied',
    setup: 'Set up once after buying',
    setupJson: 'Add the StackD registry to components.json:',
    setupKey: 'Put the licence key from your Gumroad receipt in .env.local. Bought more than one? Separate the keys with commas.',
    cats: { ai: 'AI', characters: 'Characters', buttons: 'Buttons', inputs: 'Inputs', loaders: 'Loaders', cards: 'Cards', notifications: 'Notifications', text: 'Text', widgets: 'Widgets', navigation: 'Navigation', media: 'Images', audio: 'Audio' },
  },
  es: {
    title: 'Componentes',
    intro: 'Componentes de interfaz con el archivo de Figma y el código en React. Pruébalos aquí mismo.',
    categories: 'Categorías',
    all: 'Todos',
    free: 'Gratis',
    soon: 'Próximamente',
    by: 'Hecho por Arnau López',
    open: 'Abrir',
    close: 'Cerrar',
    shape: 'Forma',
    eyes: 'Ojos',
    color: 'Color',
    botAbout: 'Un bot cuyos ojos siguen al cursor. Los ojos van sobre una esfera, así que se ve redondo al girar. Cuatro formas, cuatro tipos de ojos y cualquier color.',
    includes: ['Archivo de Figma con todas las poses', 'Código en React + Tailwind, sin otras librerías', 'Respeta el movimiento reducido'],
    promptAbout: 'Un campo de chat para productos con IA. Crece al escribir, acepta archivos, deja elegir el modelo, muestra un brillo mientras piensa y escribe la respuesta palabra a palabra. El Bot puede ir al lado como la cara del asistente. Pruébalo aquí.',
    promptIncludes: ['Archivo de Figma, escritorio y móvil', 'Código en React + Tailwind, con el Bot', 'Funciona con cualquier IA: Claude, GPT o la tuya', 'Una ruta /api/chat lista para Next.js'],
    payAbout: 'Un botón de deslizar para confirmar el pago. Arrastra el asa hasta el final: se bloquea, muestra un spinner mientras se procesa el pago y luego se llena con un check. Si lo sueltas antes, vuelve atrás. Si el pago falla, tiembla y se reinicia.',
    payIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Funciona con ratón, táctil y teclado', 'Conecta cualquier pago con una promesa'],
    statAbout: 'Una tarjeta de estadística para dashboards. El número sube y la línea se dibuja sola. Recorre la línea y el número te sigue. En modo en directo llega un punto nuevo y la línea vieja se transforma en la nueva.',
    statIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Funciona con ratón, táctil y teclado', 'Conecta tus datos o un feed en directo'],
    live: 'En directo',
    notifyAbout: 'Una pila de notificaciones. La más nueva va delante y las anteriores asoman detrás. Pasa el ratón y la pila se abre en una lista. Desliza una hacia un lado para descartarla, o deja que se cierre sola.',
    notifyIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Deslizar, tocar, ratón y teclado', 'Versión blanca y negra'],
    notify: 'Notificar',
    flapAbout: 'Texto en pequeñas fichas que giran como un panel de salidas antiguo. Cada ficha pasa por las letras hasta llegar a la nueva, y el cambio recorre el panel. Para precios, contadores, fechas de lanzamiento y titulares. Escribe para probarlo.',
    flapIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Letras, números, €, $, £ y puntuación', 'Versión blanca y negra'],
    typeHere: 'Escribe algo',
    loginAbout: 'Una tarjeta de inicio de sesión con el Bot. Sigue tu cursor, lee mientras escribes el email, se gira mientras escribes la contraseña y mira si la muestras. Sonríe cuando entras y niega con la cabeza si la contraseña está mal. Pruébalo: la contraseña es stackd.',
    loginIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Funciona con cualquier login: devuelve true o false', 'Teclado, lectores de pantalla y gestores de contraseñas'],
    timerAbout: 'Un temporizador de concentración con el Bot. Una pequeña píldora que se abre en un panel como un solo objeto: el Bot crece hasta la esquina, la hora viaja a su lado y las marcas llegan al final. El Bot mira la hora, sigue tu cursor y sonríe al terminar. Viene como isla para móvil y como notch de portátil que se abre al pasar el ratón.',
    timerIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Versión isla y notch de portátil', 'Ratón, táctil y teclado'],
    tabsAbout: 'Pestañas con un indicador que se mueve como una gota. El borde de delante sale primero y el de detrás lo alcanza, así que se estira por el camino y llega con un pequeño rebote. Agárralo y arrastra: sigue tu dedo, cede como goma en los extremos y cae en la pestaña más cercana. El texto cambia de color justo en su borde.',
    tabsIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Ratón, táctil y teclado, compatible con lectores de pantalla', 'Texto, iconos o ambos, cualquier color'],
    show: 'Mostrar',
    labels: 'Texto',
    feedbackAbout: 'Una tarjeta de valoración con el Bot. Recorre la escala del 1 al 5 y su cara cambia contigo: ojos caídos en el 1, sonrientes en el 4 y un salto de alegría en el 5. Elige un número y se abre un comentario con la pregunta adecuada. Envíalo y el Bot te da las gracias.',
    feedbackIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Funciona con cualquier backend: un solo onSubmit', 'Ratón, táctil y teclado, compatible con lectores de pantalla'],
    paletteAbout: 'El menú de ⌘K. Escribe unas letras y encuentra el comando, aunque no estén seguidas: con "nwprj" sale New project. Los comandos van en grupos, con los recientes arriba, y algunos abren su propia página. El Bot es el icono de búsqueda: mira la fila en la que estás, se pone triste si no hay resultados y sonríe cuando se ejecuta un comando. Pruébalo y pulsa ⌘K.',
    paletteIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Pensado para teclado, compatible con lectores de pantalla', 'Como pop-up con ⌘K o integrado, cualquier color'],
    pressK: 'Abrir como pop-up · ⌘K',
    dropAbout: 'Una zona para soltar archivos con el Bot. Acerca un archivo y abre la boca; suéltalo y se lo traga, mastica y la subida aparece debajo con un porcentaje que rueda. Las imágenes tienen miniatura. ¿Demasiado grande? Niega con la cabeza, y si insistes empieza a contestarte. Prueba con los archivos de la bandeja.',
    loaderAbout: 'Un loader en el que el Bot hace el trabajo que estás esperando. Cada paso dice qué es: el Bot lee (sus ojos recorren las líneas), piensa (mira hacia arriba) o trabaja (mira abajo y mastica). El paso brilla, una barra se llena paso a paso y una lista los va marcando. Al terminar, salta de alegría. Si falla, frunce el ceño y aparece Reintentar. También como píldora pequeña.',
    loaderIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Progreso exacto o un brillo en movimiento', 'Tarjeta y píldora, compatible con lectores de pantalla'],
    progressLabel: 'Progreso',
    known: 'Conocido',
    otpAbout: 'Un campo de código de un solo uso con el Bot. Sus ojos siguen la casilla en la que escribes, y un código pegado entra dígito a dígito. Al llenar la última casilla comprueba solo mientras las casillas hacen una ola. Bien: las casillas se ponen verdes y el Bot se alegra. Mal: la fila tiembla y el Bot se pone un poco más triste cada vez. Prueba con 482913.',
    otpIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Pegar, autocompletar del móvil y lectores de pantalla', 'Cualquier longitud, números o letras, cuenta atrás para reenviar'],
    codeLabel: 'Código',
    digits: 'Dígitos',
    dots: 'Puntos',
    tryCode: 'Prueba 482913',
    glassAbout: 'Arrastra sobre una imagen para cubrir partes con cristal. Cada baldosa es su propio cristal: esmerilado, una lupa que aumenta un punto cercano, un espejo o una mancha, así que se lee como cristal y no como una caja gris. Las baldosas entran con un rebote; si empiezas sobre cristal, lo borras. Guarda el resultado como PNG. Pruébalo en la imagen.',
    glassIncludes: ['Archivo de Figma con las baldosas y ejemplos', 'Código en React + Tailwind, sin otras librerías', 'Ratón, táctil y teclado', 'Ver debajo, borrar y guardar como PNG (barra opcional con el Bot)'],
    glassLabel: 'Cristal',
    swapAbout: 'Una pila de imágenes en profundidad, cada carta un paso más atrás e inclinada. Pulsa la de delante, o arrástrala y lánzala, y se va al fondo mientras las demás avanzan; un arrastre corto vuelve a su sitio. También puede cambiar sola cada pocos segundos, y se para mientras estás encima.',
    swapIncludes: ['Archivo de Figma con la pila y las cartas', 'Código en React + Tailwind, sin otras librerías', 'Pulsar, arrastrar y lanzar, teclado y lectores de pantalla', 'Tus propias cartas, tamaño, paso e inclinación, cambio automático'],
    pillsLabel: 'Títulos',
    compareAbout: 'Dos imágenes separadas por una línea que arrastras. La línea es de gelatina: el punto que agarras sigue tu mano y los extremos van detrás, así que un arrastre rápido la curva y tiembla un poco al quedarse quieta. El borde de la imagen se curva con ella. Pulsa en cualquier sitio para saltar ahí.',
    activityAbout: 'Una cuadrícula de días, más oscuros los más activos. Pasa por encima y los días cerca del cursor se levantan como bajo una lupa. Cambia a 3D y la cuadrícula se inclina mientras cada día crece hasta una barra de su altura real, semana a semana. Arrastra para girarla.',
    activityIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Tus propios datos: cualquier fecha y unidad', 'Plano y 3D, ratón, táctil y teclado'],
    viewLabel: 'Vista',
    flat: 'Plano',
    colourLabel: 'Color',
    pullAbout: 'Tira de la lista hacia abajo y una hebra de tinta se estira bajo tu dedo, siguiéndote a izquierda y derecha. Pasada la línea se rompe y la gota abre los ojos: el Bot. Gira sobre sí mismo mientras se actualiza, sonríe al terminar y vuelve a subir. Funciona con trackpad, ratón y táctil.',
    pullIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Trackpad, ratón y táctil', 'Envuelve cualquier lista: tú le das la actualización'],
    pullHint: 'Tira de la lista hacia abajo',
    clockAbout: 'Un reloj por ciudad. Arrastra el minutero de cualquiera y todos giran a la vez, así encuentras una hora que va bien a todos. Al soltar se desliza al cuarto de hora más cercano. Cuando todas las ciudades están en horario de trabajo, un pequeño aviso lo dice. Ahora vuelve a la hora real.',
    clockIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Zonas horarias reales y horario de verano, cualquier ciudad', 'Blanco, negro, o día y noche por ciudad'],
    panelsLabel: 'Paneles',
    dayNight: 'Día / noche',
    memoAbout: 'Una nota de voz que recortas. Arrastra las dos asas: lo que dejas fuera se encoge en puntos, y si sueltas cerca de una pausa el asa se desliza hasta ella, así nunca cortas una palabra a medias. Dale a play y el Bot dice la nota. Guardar lanza un anillo de luz por la tarjeta.',
    memoIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Lee cualquier archivo de audio: forma de onda y pausas', 'Ratón, táctil y teclado, funciona con lectores de pantalla'],
    compareIncludes: ['Archivo de Figma con el slider y sus estados', 'Código en React + Tailwind, sin otras librerías', 'Ratón, táctil y teclado, funciona con lectores de pantalla', 'Tus propias imágenes y etiquetas, cualquier tamaño, cuánto se curva'],
    lineLabel: 'Línea',
    jellyLabel: 'Gelatina',
    autoLabel: 'Auto',
    tilesLabel: 'Baldosas',
    soft: 'Suave',
    thick: 'Grueso',
    small: 'Pequeñas',
    large: 'Grandes',
    unknown: 'Desconocido',
    dropIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, con el Bot', 'Soltar, clic, pegar, teclado y lectores de pantalla', 'Conecta cualquier subida: progreso, cancelar y reintentar'],
    icons: 'Iconos',
    shapeLabel: 'Forma',
    hoverNotch: 'Pasa el ratón por el notch',
    notch: 'Notch',
    island: 'Isla',
    dialAbout: 'Un mando que se gira arrastrando en círculo. Sigue tu dedo con suavidad mientras el valor y el anillo de marcas avanzan a pasos, y al soltar encaja con un pequeño rebote. En los extremos cede un poco, como goma. Gíralo.',
    dialIncludes: ['Archivo de Figma con todos los estados', 'Código en React + Tailwind, sin otras librerías', 'Ratón, táctil y teclado, compatible con lectores de pantalla', 'Cualquier rango, paso, etiqueta y color'],
    buy: 'Comprar',
    autoClose: 'Cierre automático',
    theme: 'Tarjeta',
    light: 'Blanca',
    darkT: 'Negra',
    bot: 'Bot',
    on: 'Sí',
    off: 'No',
    soonGet: 'Próximamente',
    get: 'Consíguelo gratis',
    emailNote: 'Se consigue a través de Gumroad. El archivo de Figma y el código llegan a tu correo.',
    install: 'Instalar con shadcn',
    copy: 'Copiar',
    copied: 'Copiado',
    setup: 'Configúralo una vez tras comprar',
    setupJson: 'Añade el registro de StackD a components.json:',
    setupKey: 'Pon la clave de licencia del recibo de Gumroad en .env.local. ¿Compraste más de uno? Separa las claves con comas.',
    cats: { ai: 'IA', characters: 'Personajes', buttons: 'Botones', inputs: 'Campos', loaders: 'Cargas', cards: 'Tarjetas', notifications: 'Notificaciones', text: 'Texto', widgets: 'Widgets', navigation: 'Navegación', media: 'Imágenes', audio: 'Audio' },
  },
}

type Cat = keyof (typeof COPY)['en']['cats']
const CATS = Object.keys(COPY.en.cats) as Cat[]

// The live components, with their category
type Id = 'bot' | 'prompt' | 'pay' | 'stat' | 'notify' | 'flap' | 'dial' | 'timer' | 'login' | 'tabs' | 'feedback' | 'palette' | 'drop' | 'loader' | 'otp' | 'glass' | 'swap' | 'compare' | 'memo' | 'clock' | 'pull' | 'activity'
// Shop order (not the kit numbers): the liveliest first, the three picture ones kept apart
const ITEMS: { id: Id; cat: Cat }[] = [
  { id: 'swap', cat: 'media' },
  { id: 'bot', cat: 'characters' },
  { id: 'prompt', cat: 'ai' },
  { id: 'palette', cat: 'navigation' },
  { id: 'memo', cat: 'audio' },
  { id: 'drop', cat: 'inputs' },
  { id: 'pull', cat: 'loaders' },
  { id: 'flap', cat: 'text' },
  { id: 'compare', cat: 'media' },
  { id: 'clock', cat: 'widgets' },
  { id: 'activity', cat: 'cards' },
  { id: 'dial', cat: 'inputs' },
  { id: 'pay', cat: 'buttons' },
  { id: 'tabs', cat: 'navigation' },
  { id: 'glass', cat: 'media' },
  { id: 'login', cat: 'inputs' },
  { id: 'notify', cat: 'notifications' },
  { id: 'stat', cat: 'cards' },
  { id: 'timer', cat: 'widgets' },
  { id: 'loader', cat: 'loaders' },
  { id: 'otp', cat: 'inputs' },
  { id: 'feedback', cat: 'inputs' },
]

// The paid ones; everything else is free
const PRICE: Partial<Record<Id, string>> = { flap: '€7', dial: '€7', timer: '€7', login: '€7', tabs: '€7', feedback: '€7', palette: '€7', drop: '€7', loader: '€7', otp: '€7', glass: '€7', swap: '€7', compare: '€7', memo: '€7', clock: '€7', pull: '€7', activity: '€7' }

// The desktop grid, row by row: 1 = a tile, 0 = an empty cell
const PATTERN = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1]

// Body colour, and the eye colour that reads on it
const COLORS = [
  { name: 'White', body: '#FFFFFF', eyes: '#141310' },
  { name: 'Ink', body: '#141310', eyes: '#FFFFFF' },
  { name: 'Wine', body: '#901919', eyes: '#FFFFFF' },
  { name: 'Olive', body: '#6C8544', eyes: '#FFFFFF' },
  { name: 'Ochre', body: '#BE9344', eyes: '#FFFFFF' },
  { name: 'Lilac', body: '#C9B8FF', eyes: '#141310' },
]

// Where each component is delivered
const GUMROAD: Record<Id, string> = {
  bot: 'https://arnolop.gumroad.com/l/stackd?wanted=true',
  prompt: 'https://arnolop.gumroad.com/l/prompt_bar?wanted=true',
  pay: 'https://arnolop.gumroad.com/l/slide_to_pay?wanted=true',
  stat: 'https://arnolop.gumroad.com/l/stat_card?wanted=true',
  notify: 'https://arnolop.gumroad.com/l/notification_stack?wanted=true',
  flap: 'https://arnolop.gumroad.com/l/split_flap?wanted=true',
  dial: 'https://arnolop.gumroad.com/l/rotary_dial?wanted=true',
  timer: 'https://arnolop.gumroad.com/l/focus_timer?wanted=true',
  login: 'https://arnolop.gumroad.com/l/bot_login?wanted=true',
  tabs: 'https://arnolop.gumroad.com/l/Elastictabs?wanted=true',
  feedback: 'https://arnolop.gumroad.com/l/feedback?wanted=true',
  palette: 'https://arnolop.gumroad.com/l/command_palette?wanted=true',
  drop: 'https://arnolop.gumroad.com/l/file_drop?wanted=true',
  loader: 'https://arnolop.gumroad.com/l/bot_loader?wanted=true',
  otp: 'https://arnolop.gumroad.com/l/otp_input?wanted=true',
  glass: 'https://arnolop.gumroad.com/l/glass_tiles?wanted=true',
  swap: 'https://arnolop.gumroad.com/l/card_swap?wanted=true',
  compare: 'https://arnolop.gumroad.com/l/before_after?wanted=true',
  memo: 'https://arnolop.gumroad.com/l/voice_memo?wanted=true',
  clock: 'https://arnolop.gumroad.com/l/world_clock?wanted=true',
  pull: '',
  activity: '',
}

const tile = 'relative aspect-square overflow-hidden rounded-[18px]'

// Each component's name in the shadcn registry (www.stackd.codes/r/{name}.json)
const REGISTRY_NAME: Record<Id, string> = {
  bot: 'bot', prompt: 'prompt-bar', pay: 'slide-to-pay', stat: 'stat-card', notify: 'notification-stack',
  flap: 'split-flap', dial: 'rotary-dial', timer: 'focus-timer', login: 'bot-login', tabs: 'elastic-tabs',
  feedback: 'bot-feedback', palette: 'command-palette', drop: 'file-drop', loader: 'bot-loader', otp: 'otp-input',
  glass: 'glass-tiles', swap: 'card-swap', compare: 'before-after', memo: 'voice-memo', clock: 'world-clock', pull: 'pull-to-refresh', activity: 'activity-grid',
}
const REGISTRY_BY_HREF: Record<string, string> = Object.fromEntries(
  (Object.keys(GUMROAD) as Id[]).map((id) => [GUMROAD[id], REGISTRY_NAME[id]]),
)
const REGISTRY_SETUP = `"registries": {
  "@stackd": {
    "url": "https://www.stackd.codes/r/{name}.json",
    "headers": { "X-License-Key": "\${STACKD_LICENSE_KEY}" }
  }
}`

/** A command or snippet with a copy button */
function Copyable({ t, text, small }: { t: T; text: string; small?: boolean }) {
  const [done, setDone] = useState(false)
  return (
    <div className="relative">
      <pre className={`overflow-x-auto rounded-[12px] bg-card py-2.5 pl-3 pr-16 leading-[1.6] text-fg-muted ${small ? 'text-[10.5px]' : 'text-[11px]'}`}>
        <code>{text}</code>
      </pre>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(text).then(() => {
            setDone(true)
            window.setTimeout(() => setDone(false), 1400)
          })
        }}
        className="absolute right-1.5 top-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] text-fg-dim transition-colors hover:text-ink"
      >
        {done ? t.copied : t.copy}
      </button>
    </div>
  )
}

/** Install with shadcn: free ones by URL; paid ones through the @stackd registry with the licence key */
function Install({ t, name, paid }: { t: T; name: string; paid: boolean }) {
  return (
    <div className="mt-5">
      <p className="mb-1.5 text-fg-faint">{t.install}</p>
      <Copyable t={t} text={paid ? `npx shadcn@latest add @stackd/${name}` : `npx shadcn@latest add https://www.stackd.codes/r/${name}.json`} />
      {paid ? (
        <details className="group mt-2">
          <summary className="cursor-pointer list-none text-[12px] text-fg-dim transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90">›</span> {t.setup}
          </summary>
          <div className="mt-2 space-y-2 text-[12px] text-fg-muted">
            <p>{t.setupJson}</p>
            <Copyable t={t} text={REGISTRY_SETUP} small />
            <p>{t.setupKey}</p>
            <Copyable t={t} text="STACKD_LICENSE_KEY=your-key" small />
          </div>
        </details>
      ) : null}
    </div>
  )
}

export function Shop() {
  const { lang, setLang } = useLanguage()
  const t = COPY[lang]
  const [cat, setCat] = useState<Cat | 'all'>('all')

  const shown = ITEMS.filter((i) => cat === 'all' || i.cat === cat)
  // Fill the pattern: real components first, stand-ins after (only under "All")
  let next = 0
  const cells = PATTERN.map((on, i) => {
    if (!on) return { key: `void-${i}`, kind: 'void' as const }
    const item = shown[next]
    const n = next++
    if (item) return { key: item.id, kind: 'item' as const, item }
    return cat === 'all' ? { key: `soon-${n}`, kind: 'soon' as const } : { key: `void-${i}`, kind: 'void' as const }
  })

  const filters: [Cat | 'all', string, number][] = [
    ['all', t.all, ITEMS.length],
    ...CATS.map((c) => [c, t.cats[c], ITEMS.filter((i) => i.cat === c).length] as [Cat, string, number]),
  ]

  return (
    <div className="min-h-screen bg-card p-3 text-[13px] leading-[1.45] tracking-[-0.005em] text-ink" style={{ fontFamily: SANS }}>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[248px_minmax(0,1fr)]">
        {/* The panel: on the left on a big screen, across the top on a phone */}
        <aside className="flex flex-col rounded-[18px] bg-paper p-4 lg:sticky lg:top-3 lg:h-[calc(100svh-24px)]">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5" />
            StackD
          </Link>
          <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.02em]">{t.title}</h1>
          <p className="mt-1 max-w-[30ch] text-fg-dim">{t.intro}</p>

          <p className="mt-6 hidden text-fg-faint lg:block">{t.categories}</p>
          <nav aria-label={t.categories} className="-mx-1 mt-4 flex gap-1 overflow-x-auto lg:mt-2 lg:flex-col lg:overflow-visible">
            {filters.map(([id, label, count]) => (
              <button
                key={id}
                onClick={() => setCat(id)}
                aria-pressed={cat === id}
                className={`flex shrink-0 items-center justify-between gap-3 rounded-[10px] px-3 py-1.5 text-left transition-colors ${
                  cat === id ? 'bg-card text-ink' : 'text-fg-muted hover:bg-card/60 hover:text-ink'
                }`}
              >
                {label}
                <span className="text-fg-faint">{count}</span>
              </button>
            ))}
          </nav>

          {/* Who is behind it: the portfolio and LinkedIn carry the developer side */}
          <div className="mt-5 flex items-end justify-between gap-4 text-fg-dim lg:mt-auto lg:pt-6">
            <div>
              <p className="text-fg-faint">{t.by}</p>
              <p className="mt-0.5 flex gap-3">
                <a href="https://arnau-lopez.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  Portfolio ↗
                </a>
                <a href="https://www.linkedin.com/in/arnau-lopez-selles/" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-ink">
                  LinkedIn ↗
                </a>
              </p>
            </div>
            <span className="flex gap-2">
              {(['en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`uppercase transition-colors hover:text-ink ${lang === l ? 'text-ink' : 'text-fg-ghost'}`}
                >
                  {l}
                </button>
              ))}
            </span>
          </div>
        </aside>

        <main id="contenido">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cells.map((c) =>
              c.kind === 'item' ? (
                <li key={c.key}>
                  {c.item.id === 'bot' ? <BotTile t={t} /> : c.item.id === 'prompt' ? <PromptTile t={t} /> : c.item.id === 'pay' ? <PayTile t={t} /> : c.item.id === 'stat' ? <StatTile t={t} /> : c.item.id === 'notify' ? <NotifyTile t={t} /> : c.item.id === 'flap' ? <FlapTile t={t} /> : c.item.id === 'dial' ? <DialTile t={t} /> : c.item.id === 'timer' ? <TimerTile t={t} /> : c.item.id === 'login' ? <LoginTile t={t} /> : c.item.id === 'tabs' ? <TabsTile t={t} /> : c.item.id === 'feedback' ? <FeedbackTile t={t} /> : c.item.id === 'palette' ? <PaletteTile t={t} /> : c.item.id === 'drop' ? <DropTile t={t} /> : c.item.id === 'loader' ? <LoaderTile t={t} /> : c.item.id === 'otp' ? <OtpTile t={t} /> : c.item.id === 'glass' ? <GlassTile t={t} /> : c.item.id === 'swap' ? <SwapTile t={t} /> : c.item.id === 'memo' ? <MemoTile t={t} /> : c.item.id === 'clock' ? <ClockTile t={t} /> : c.item.id === 'pull' ? <PullTile t={t} /> : c.item.id === 'activity' ? <ActivityTile t={t} /> : <CompareTile t={t} />}
                </li>
              ) : c.kind === 'soon' ? (
                <li key={c.key} aria-hidden className={`${tile} bg-ink`}>
                  <span className="absolute bottom-4 left-4 text-paper/35">{t.soon}</span>
                </li>
              ) : (
                // Empty cells only on a big screen; on a phone it is a plain list
                <li key={c.key} aria-hidden className="hidden aspect-square lg:block" />
              ),
            )}
          </ul>
        </main>
      </div>
    </div>
  )
}

type Config = { shape: BotShape; eyes: BotEyes; color: (typeof COLORS)[number] }
type T = (typeof COPY)['en'] | (typeof COPY)['es']

const shapes = Object.keys(SHAPES) as BotShape[]
const eyeKinds = Object.keys(EYES) as BotEyes[]

/** The Bot, live. The tile opens the details, where its shape, eyes and colour can be changed. */
function BotTile({ t }: { t: T }) {
  const [cfg, setCfg] = useState<Config>({ shape: 'pill', eyes: 'tall', color: COLORS[0] })
  const [open, setOpen] = useState(false)
  const { shape, eyes, color } = cfg
  // A white bot sits on a dark tile
  const dark = color.name === 'White'

  return (
    <>
      <article className={`kit-tile group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        {/* The whole tile opens the details */}
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Bot`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Bot size={112} shape={shape} eyes={eyes} color={color.body} eyeColor={color.eyes} within=".kit-tile" />
        </div>

      </article>

      {open ? <BotDetail t={t} cfg={cfg} setCfg={setCfg} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

/** The big pop-up: the live component on the left; details, options, code and the Gumroad button on the right. */
function Detail({
  t,
  cat,
  name,
  about,
  includes,
  usage,
  href,
  price,
  stage,
  dark,
  options,
  onClose,
}: {
  t: T
  cat: string
  name: string
  about: string
  includes: string[]
  usage: string
  href: string
  price?: string
  stage: React.ReactNode
  dark?: boolean
  options: React.ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)

  // A native dialog: it traps focus, closes on Escape, and the page behind stops scrolling
  useEffect(() => {
    ref.current?.showModal()
    // showModal focuses the first focusable thing (a dropzone, an input), which then shows its focus ring.
    // Focus the dialog itself instead; Tab still moves into it.
    ref.current?.focus({ preventScroll: true })
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [])

  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-0 h-[100dvh] max-h-none w-full max-w-none bg-transparent p-0 outline-none backdrop:bg-card sm:m-auto sm:backdrop:bg-ink/40 sm:backdrop:backdrop-blur-[2px] sm:h-[min(640px,calc(100svh-48px))] sm:w-[min(1040px,calc(100vw-48px))]"
      style={{ fontFamily: SANS }}
    >
      <div className="grid h-full grid-cols-[minmax(0,1fr)] grid-rows-[max-content_1fr] overflow-y-auto bg-card p-3 text-[13px] leading-[1.45] text-ink sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:grid-rows-1 sm:gap-3 sm:overflow-hidden sm:rounded-[24px]">
        {/* The stage */}
        <div
          className={`kit-stage relative flex min-h-[360px] items-center justify-center rounded-[18px] p-5 transition-colors duration-300 sm:min-h-0 ${dark ? 'bg-ink' : 'bg-paper'}`}
        >
          {stage}
          {/* On a phone the details scroll away, so the close button also sits on the stage */}
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={t.close}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-ink sm:hidden"
          >
            ✕
          </button>
        </div>

        {/* The details */}
        <div className="mt-3 flex flex-col rounded-[18px] bg-paper p-5 sm:mt-0 sm:overflow-y-auto [&>*]:shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-fg-faint">{cat}</p>
              <h2 className="mt-0.5 text-[20px] font-semibold tracking-[-0.02em]">{name}</h2>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label={t.close}
              className="hidden h-8 w-8 items-center justify-center rounded-full bg-card text-fg-dim transition-colors hover:text-ink sm:flex"
            >
              ✕
            </button>
          </div>
          <p className="mt-3 max-w-[44ch] text-fg-muted">{about}</p>

          <div className="mt-5 space-y-3">{options}</div>

          <pre className="mt-5 overflow-x-auto rounded-[12px] bg-card px-3 py-2.5 text-[11px] leading-[1.6] text-fg-muted">
            <code>{usage}</code>
          </pre>

          {REGISTRY_BY_HREF[href] ? <Install t={t} name={REGISTRY_BY_HREF[href]} paid={!!price} /> : null}

          <ul className="mt-5 space-y-1 text-fg-muted">
            {includes.map((i) => (
              <li key={i} className="flex gap-2">
                <span className="text-fg-ghost">✓</span>
                {i}
              </li>
            ))}
          </ul>

          <div className="mt-auto pt-6">
            {/* Gumroad asks for the email and sends the files; it is also where paid components will sell */}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center rounded-full bg-ink px-4 font-medium text-paper transition-opacity hover:opacity-85"
              >
                {price ? `${t.buy} · ${price}` : t.get}
              </a>
            ) : (
              <span className="flex h-10 w-full items-center justify-center rounded-full bg-card px-4 text-fg-dim">{t.soonGet}</span>
            )}
            <p className="mt-2 text-[11px] text-fg-faint">{t.emailNote}</p>
          </div>
        </div>
      </div>
    </dialog>
  )
}

function BotDetail({ t, cfg, setCfg, onClose }: { t: T; cfg: Config; setCfg: (c: Config) => void; onClose: () => void }) {
  const { shape, eyes, color } = cfg
  return (
    <Detail
      t={t}
      cat={t.cats.characters}
      name="Bot"
      about={t.botAbout}
      includes={t.includes}
      usage={`<Bot shape="${shape}" eyes="${eyes}" color="${color.body}" eyeColor="${color.eyes}" />`}
      href={GUMROAD.bot}
      dark={color.name === 'White'}
      onClose={onClose}
      stage={<Bot size={200} shape={shape} eyes={eyes} color={color.body} eyeColor={color.eyes} within=".kit-stage" />}
      options={<BotOptions t={t} cfg={cfg} setCfg={setCfg} />}
    />
  )
}

/** Shape, eyes and colour: in the Bot's pop-up, and for the bot in the prompt bar's */
function BotOptions({ t, cfg, setCfg, eyesToo = true }: { t: T; cfg: Config; setCfg: (c: Config) => void; eyesToo?: boolean }) {
  const { shape, eyes, color } = cfg
  return (
    <>
      <Choice label={t.shape}>
        {shapes.map((s) => (
          <Pick key={s} on={shape === s} label={s} onClick={() => setCfg({ ...cfg, shape: s })}>
            <ShapeIcon shape={s} />
          </Pick>
        ))}
      </Choice>
      {eyesToo ? (
        <Choice label={t.eyes}>
          {eyeKinds.map((e) => (
            <Pick key={e} on={eyes === e} label={e} onClick={() => setCfg({ ...cfg, eyes: e })}>
              <EyesIcon eyes={e} />
            </Pick>
          ))}
        </Choice>
      ) : null}
      <Choice label={t.color}>
        {COLORS.map((c) => (
          <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setCfg({ ...cfg, color: c })}>
            <Swatch color={c.body} />
          </Pick>
        ))}
      </Choice>
    </>
  )
}

/** 02 · AI prompt bar, live and small in the tile; the empty part of the tile opens the details */
function PromptTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [withBot, setWithBot] = useState(true)
  const [cfg, setCfg] = useState<Config>({ shape: 'pill', eyes: 'tall', color: COLORS[1] })
  // The bar rests in the middle of the tile and slides down once you start using it
  const [focused, setFocused] = useState(false)
  const [used, setUsed] = useState(false)
  const down = focused || used
  const botProps = { shape: cfg.shape, eyes: cfg.eyes, color: cfg.color.body, eyeColor: cfg.color.eyes }

  return (
    <>
      <article className={`group ${tile} bg-paper [container-type:size]`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} AI prompt bar`} className="absolute inset-0 cursor-pointer" />
        <div
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={() => setFocused(false)}
          onKeyDownCapture={(e) => e.key === 'Enter' && !e.shiftKey && setUsed(true)}
          onClickCapture={(e) => (e.target as HTMLElement).closest('button[aria-label="Send"]') && setUsed(true)}
          // From the bottom of the tile up to its middle: half the tile, minus the 12px gap, plus half the bar
          style={{ transform: down ? 'translateY(0)' : 'translateY(calc(-50cqh + 12px + 50%))' }}
          className="absolute inset-x-3 bottom-3 transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none"
        >
          <PromptBar compact bot={withBot ? botProps : false} placeholder="Ask anything" />
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.ai}
          name="AI prompt bar"
          about={t.promptAbout}
          includes={t.promptIncludes}
          usage={withBot ? `<PromptBar bot={{ shape: "${cfg.shape}", color: "${cfg.color.body}" }} onSend={yourAI} />` : '<PromptBar onSend={yourAI} />'}
          href={GUMROAD.prompt}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex h-full w-full items-end justify-center">
              <PromptBar bot={withBot ? botProps : false} />
            </div>
          }
          options={
            <>
              <Choice label={t.bot}>
                <Pick on={withBot} label={t.on} onClick={() => setWithBot(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!withBot} label={t.off} onClick={() => setWithBot(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
              {withBot ? <BotOptions t={t} cfg={cfg} setCfg={setCfg} eyesToo={false} /> : null}
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 03 · Slide to pay, live in the tile. It resets a moment after paying so it can be tried again. */
function PayTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const [round, setRound] = useState(0)
  const pay = () =>
    new Promise<void>((ok) => setTimeout(ok, 1600)).then(() => {
      setTimeout(() => setRound((n) => n + 1), 2200)
    })
  const dark = color.name === 'White'
  const slider = <SlideToPay key={`${round}-${color.name}`} color={color.body} fg={color.eyes} onConfirm={pay} />

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Slide to pay`} className="absolute inset-0 cursor-pointer" />
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">{slider}</div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.buttons}
          name="Slide to pay"
          about={t.payAbout}
          includes={t.payIncludes}
          usage={`<SlideToPay amount="€24.00" color="${color.body}" fg="${color.eyes}" onConfirm={yourPayment} />`}
          href={GUMROAD.pay}
          dark={dark}
          onClose={() => setOpen(false)}
          stage={<div className="flex w-full justify-center">{slider}</div>}
          options={
            <Choice label={t.color}>
              {COLORS.map((c) => (
                <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                  <Swatch color={c.body} />
                </Pick>
              ))}
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

// The line can't be the card's own colour: no white line on the white card, no ink on the black one
const lineColors = (dark: boolean) => COLORS.filter((c) => c.name !== (dark ? 'Ink' : 'White'))

/** 04 · Live stat card, on a dark tile so the white card stands out */
function StatTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const [live, setLive] = useState(true)
  const colors = lineColors(dark)
  // Switching the card keeps the colour if it still reads, otherwise the card's default (ink or white)
  const setTheme = (d: boolean) => {
    setDark(d)
    if (!lineColors(d).includes(color)) setColor(d ? COLORS[0] : COLORS[1])
  }
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Live stat card`} className="absolute inset-0 cursor-pointer" />
        <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-center">
          <StatCard live theme={theme} color={color.body} />
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.cards}
          name="Live stat card"
          about={t.statAbout}
          includes={t.statIncludes}
          usage={`<StatCard label="Revenue" data={points}${dark ? ' theme="dark"' : ''} color="${color.body}"${live ? ' live' : ''} />`}
          href={GUMROAD.stat}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={<StatCard key={String(live)} live={live} theme={theme} color={color.body} />}
          options={
            <>
              <Choice label={t.live}>
                <Pick on={live} label={t.on} onClick={() => setLive(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!live} label={t.off} onClick={() => setLive(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setTheme(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setTheme(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.color}>
                {colors.map((c) => (
                  <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                    <Swatch color={c.body} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 05 · Notification stack: sample notes, cycled by the Notify button */
const NOTES: Omit<Note, 'id'>[] = [
  { title: 'Payment received', body: 'Lena paid €240.00 for order #1042.', time: 'now', icon: <Dot c="#6C8544" /> },
  { title: 'New comment', body: 'Marc: "Can we move the call to 4?"', time: 'now', icon: <Dot c="#C9B8FF" /> },
  { title: 'Deploy finished', body: 'stackd.codes is live. Built in 42 s.', time: 'now', icon: <Dot c="currentColor" /> },
  { title: 'Invoice overdue', body: 'Invoice #318 is 3 days late.', time: 'now', icon: <Dot c="#901919" />, action: { label: 'Send reminder', onClick: () => {} } },
  { title: 'Low stock', body: 'Only 4 left of Oak desk, large.', time: 'now', icon: <Dot c="#BE9344" /> },
]

function Dot({ c }: { c: string }) {
  return <span className="mt-1 block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
}

/** The stack with its own list and a Notify button. `max` keeps the tile from overflowing. */
function NotifyPlay({ t, dark, auto, max }: { t: T; dark: boolean; auto: boolean; max: number }) {
  const [n, setN] = useState(3)
  const [notes, setNotes] = useState<Note[]>(() => NOTES.slice(0, 3).map((x, i) => ({ ...x, id: i })))
  const notify = () => {
    setNotes((l) => [...l, { ...NOTES[n % NOTES.length], id: n }].slice(-max))
    setN(n + 1)
  }
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <NotificationStack
        notes={notes}
        onDismiss={(id) => setNotes((l) => l.filter((x) => x.id !== id))}
        theme={dark ? 'dark' : 'light'}
        duration={auto ? 5000 : 0}
      />
      <button
        type="button"
        onClick={notify}
        className={`relative rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-85 ${dark ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}
      >
        {t.notify}
      </button>
    </div>
  )
}

/** 05 · Notification stack. White notes on a dark tile; black notes on a white one. */
function NotifyTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [auto, setAuto] = useState(false)

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Notification stack`} className="absolute inset-0 cursor-pointer" />
        <div className="absolute inset-x-3 bottom-12">
          <NotifyPlay t={t} dark={dark} auto={false} max={3} />
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.notifications}
          name="Notification stack"
          about={t.notifyAbout}
          includes={t.notifyIncludes}
          usage={`<NotificationStack notes={notes} onDismiss={remove}${dark ? ' theme="dark"' : ''}${auto ? '' : ' duration={0}'} />`}
          href={GUMROAD.notify}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex h-full w-full items-end justify-center pb-4">
              <NotifyPlay key={String(auto)} t={t} dark={dark} auto={auto} max={6} />
            </div>
          }
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.autoClose}>
                <Pick on={auto} label={t.on} onClick={() => setAuto(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!auto} label={t.off} onClick={() => setAuto(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

const FLAP_WORDS = ['STACKD', 'HELLO', '€24.00', 'GATE B', 'ON TIME']

/** The board with its words cycling, until someone types their own */
function FlapPlay({ t, dark, size, length, input }: { t: T; dark: boolean; size: number; length: number; input?: boolean }) {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (typed) return
    const id = setInterval(() => setI((n) => n + 1), 3500)
    return () => clearInterval(id)
  }, [typed])
  return (
    <div className="flex flex-col items-center gap-6">
      <SplitFlap value={typed || FLAP_WORDS[i % FLAP_WORDS.length]} length={length} align="center" theme={dark ? 'dark' : 'light'} size={size} />
      {input ? (
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value.slice(0, length))}
          placeholder={t.typeHere}
          className="w-56 rounded-full bg-card px-4 py-2 text-center text-[16px] uppercase text-ink outline-none placeholder:normal-case placeholder:text-fg-faint sm:text-[14px]"
        />
      ) : null}
    </div>
  )
}

/** 06 · Split-flap display, the first paid one. Black tiles on white; white tiles on black. */
function FlapTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Split-flap display`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <FlapPlay t={t} dark={dark} size={48} length={6} />
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.text}
          name="Split-flap display"
          about={t.flapAbout}
          includes={t.flapIncludes}
          usage={`<SplitFlap value="€24.00" length={8}${dark ? '' : ' theme="light"'} />`}
          href={GUMROAD.flap}
          price={PRICE.flap}
          dark={!dark}
          onClose={() => setOpen(false)}
          stage={<FlapPlay t={t} dark={dark} size={52} length={8} input />}
          options={
            <Choice label={t.theme}>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

/** 07 · Rotary dial. A white knob on a white tile; a black knob on a black one. */
function DialTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [color, setColor] = useState(COLORS[1])
  const colors = lineColors(dark)
  const setTheme = (d: boolean) => {
    setDark(d)
    if (!lineColors(d).includes(color)) setColor(d ? COLORS[0] : COLORS[1])
  }
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-ink' : 'bg-paper'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Rotary dial`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <RotaryDial theme={theme} color={color.body} size={170} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="Rotary dial"
          about={t.dialAbout}
          includes={t.dialIncludes}
          usage={`<RotaryDial label="Volume"${dark ? ' theme="dark"' : ''} color="${color.body}" onChange={setVolume} />`}
          href={GUMROAD.dial}
          price={PRICE.dial}
          dark={dark}
          onClose={() => setOpen(false)}
          stage={<RotaryDial theme={theme} color={color.body} size={260} />}
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setTheme(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setTheme(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.color}>
                {colors.map((c) => (
                  <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                    <Swatch color={c.body} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** A soft screen for the timer to sit on, like a laptop's display */
const SCREEN = 'linear-gradient(180deg,#E9E7F5 0%,#F6F1E8 100%)'

/** 08 · Focus timer. The island by default; the laptop notch (with its bezel) when picked. */
function TimerTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(true)
  const [notch, setNotch] = useState(true)
  // Big while it's a pill, scaled down as it opens so the panel always fits the tile, at any width
  const [live, setLive] = useState(false)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const room = w - 28 // a little margin on each side
  const fit = live ? Math.min(1, room / 300) : Math.min(notch ? 1.2 : 1.35, room / 148)
  const grow = { transform: `scale(${fit})`, transition: 'transform .46s cubic-bezier(.25,1,.5,1)' }
  const theme = dark ? 'dark' : 'light'
  const bezel = dark ? '#141310' : '#FFFFFF'

  const stage = (scale: number) =>
    notch ? (
      // A laptop screen whose bezel is the notch's own colour: a real notch is part of the bezel
      <div className="absolute inset-0 rounded-[18px] p-[9px]" style={{ background: bezel, boxShadow: dark ? undefined : 'inset 0 0 0 1px rgba(20,19,16,0.08)' }}>
        <div className="flex h-full justify-center overflow-hidden rounded-[11px]" style={{ background: SCREEN }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: '50% 0' }}>
          <FocusTimer variant="notch" theme={theme} remaining={18 * 60 + 5} label="Deep work" />
        </div>
        </div>
      </div>
    ) : (
      <div className="absolute inset-0 flex items-center justify-center rounded-[18px]" style={{ background: SCREEN }}>
        <div style={{ transform: `scale(${scale})` }}>
          <FocusTimer theme={theme} remaining={9 * 60 + 41} defaultOpen />
        </div>
      </div>
    )

  return (
    <>
      <article
        ref={box}
        className={`group ${tile} transition-colors duration-300`}
        style={notch ? { background: bezel, boxShadow: dark ? undefined : 'inset 0 0 0 1px rgba(20,19,16,0.08)' } : { background: SCREEN }}
      >
        {/* The notch sits in a laptop screen: a black bezel, the notch part of it */}
        {notch ? <div className="absolute inset-[7px] overflow-hidden rounded-[12px]" style={{ background: SCREEN }} /> : null}
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Focus timer`} className="absolute inset-0 cursor-pointer" />
        {notch ? (
          <>
            <span className="pointer-events-none absolute bottom-[18px] left-1/2 -translate-x-1/2 text-[11px] text-ink/40 [@media(hover:none)]:hidden">{t.hoverNotch}</span>
            <div className="pointer-events-none absolute inset-x-0 top-[7px] flex justify-center">
              <div className="pointer-events-auto motion-reduce:!transition-none" style={{ ...grow, transformOrigin: '50% 0' }}>
                <FocusTimer variant="notch" theme={theme} remaining={18 * 60 + 5} label="Deep work" open={live} onOpenChange={setLive} />
              </div>
            </div>
          </>
        ) : (
          // The island: big as a pill, eased down as it opens (same timing as the morph) so the panel fits
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="pointer-events-auto motion-reduce:!transition-none"
              style={grow}
            >
              <FocusTimer theme={theme} remaining={9 * 60 + 41} open={live} onOpenChange={setLive} />
            </div>
          </div>
        )}
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.widgets}
          name="Focus timer"
          about={t.timerAbout}
          includes={t.timerIncludes}
          usage={`<FocusTimer minutes={25}${notch ? ' variant="notch"' : ''}${dark ? '' : ' theme="light"'} onDone={takeABreak} />`}
          href={GUMROAD.timer}
          price={PRICE.timer}
          onClose={() => setOpen(false)}
          stage={stage(1)}
          options={
            <>
              <Choice label={t.shapeLabel}>
                <Pick on={notch} label={t.notch} onClick={() => setNotch(true)}>
                  <span className="px-1">{t.notch}</span>
                </Pick>
                <Pick on={!notch} label={t.island} onClick={() => setNotch(false)}>
                  <span className="px-1">{t.island}</span>
                </Pick>
              </Choice>
              <Choice label={t.theme}>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 09 · Bot login. The compact card, scaled to the tile's real width. */
function LoginTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Fit the card's width and height, leaving room for the badge and the option button
  const fit = Math.min(1, (w - 48) / 360, (w - 72) / 330)
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article ref={box} className={`group ${tile} transition-colors duration-300 ${dark ? 'bg-paper' : 'bg-ink'}`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Bot login`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[360px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <BotLogin compact theme={theme} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="Bot login"
          about={t.loginAbout}
          includes={t.loginIncludes}
          usage={`<BotLogin${dark ? ' theme="dark"' : ''} onSubmit={(email, password) => signIn(email, password)} />`}
          href={GUMROAD.login}
          price={PRICE.login}
          onClose={() => setOpen(false)}
          stage={
            <div className="w-full max-w-[360px]">
              <BotLogin theme={theme} />
            </div>
          }
          options={
            <Choice label={t.theme}>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

function Choice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-[72px] shrink-0 items-center text-fg-faint">{label}</span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Pick({ on, label, onClick, children }: { on: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={on}
      className={`flex h-8 min-w-9 shrink-0 items-center justify-center whitespace-nowrap rounded-[10px] px-2.5 transition-colors ${on ? 'bg-card text-ink' : 'text-fg-ghost hover:text-ink'}`}
    >
      {children}
    </button>
  )
}

function ShapeIcon({ shape }: { shape: BotShape }) {
  return (
    <svg viewBox="0 0 100 100" className="h-3.5 w-3.5">
      <path d={SHAPES[shape].d} fill="currentColor" />
    </svg>
  )
}

function EyesIcon({ eyes }: { eyes: BotEyes }) {
  const { w, h, r } = EYES[eyes]
  return (
    <svg viewBox="0 0 60 30" className="h-3.5 w-5">
      {[17, 43].map((x) => (
        <rect key={x} x={x - w / 2} y={15 - h / 2} width={w} height={h} rx={r} fill="currentColor" />
      ))}
    </svg>
  )
}

// The tabs' colours: every Bot colour but white, which wouldn't show on the white bar
const TAB_COLORS = COLORS.filter((c) => c.name !== 'White')

const tabIcon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const RANGE = [
  { id: 'd', label: 'Day' },
  { id: 'w', label: 'Week' },
  { id: 'm', label: 'Month' },
  { id: 'y', label: 'Year' },
]
const NAV = [
  { id: 'home', label: 'Home', icon: tabIcon('M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z') },
  { id: 'search', label: 'Search', icon: tabIcon('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4') },
  { id: 'inbox', label: 'Inbox', icon: tabIcon('M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5') },
  { id: 'me', label: 'Profile', icon: tabIcon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0') },
]

/** 10 · Elastic tabs. Two bars on an ink tile, scaled to the tile's real width. */
function TabsTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [color, setColor] = useState(TAB_COLORS[0])
  const [dark, setDark] = useState(false)
  const [icons, setIcons] = useState(true)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(1, (w - 40) / 270)
  // On a black bar a black indicator wouldn't show, so it turns white
  const ind = dark && color.name === 'Ink' ? '#FFFFFF' : color.body
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article ref={box} className={`group ${tile} bg-ink`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Elastic tabs`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex shrink-0 flex-col items-center gap-4" style={{ transform: `scale(${fit})` }}>
            <div className="pointer-events-auto">
              <ElasticTabs tabs={RANGE} color={color.body} aria-label="Range" />
            </div>
            <div className="pointer-events-auto">
              <ElasticTabs tabs={NAV} iconOnly color={color.body} aria-label="Navigation" />
            </div>
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.navigation}
          name="Elastic tabs"
          about={t.tabsAbout}
          includes={t.tabsIncludes}
          usage={`<ElasticTabs tabs={tabs}${dark ? ' theme="dark"' : ''}${icons ? '' : ' iconOnly'} color="${ind}" onChange={setTab} />`}
          href={GUMROAD.tabs}
          price={PRICE.tabs}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex flex-col items-center gap-6">
              <ElasticTabs tabs={RANGE} theme={theme} color={ind} aria-label="Range" />
              <ElasticTabs tabs={NAV} theme={theme} iconOnly={!icons} color={ind} aria-label="Navigation" />
            </div>
          }
          options={
            <>
              <Choice label={t.color}>
                {TAB_COLORS.map((c) => (
                  <Pick key={c.name} on={color.name === c.name} label={c.name} onClick={() => setColor(c)}>
                    <Swatch color={c.body} />
                  </Pick>
                ))}
              </Choice>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.show}>
                <Pick on={icons} label={t.labels} onClick={() => setIcons(true)}>
                  <span className="px-1">{t.labels}</span>
                </Pick>
                <Pick on={!icons} label={t.icons} onClick={() => setIcons(false)}>
                  <span className="px-1">{t.icons}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 11 · Bot feedback. The compact card on a white tile; after a rating it starts over. */
function FeedbackTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [round, setRound] = useState(0) // a new key = a fresh card
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(1, (w - 36) / 300, (w - 64) / 290)
  const theme = dark ? 'dark' : 'light'
  const again = () => new Promise<void>((r) => setTimeout(r, 500)).then(() => void setTimeout(() => setRound((n) => n + 1), 2400))

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Bot feedback`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[300px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <BotFeedback key={round} compact theme={theme} onSubmit={again} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="Bot feedback"
          about={t.feedbackAbout}
          includes={t.feedbackIncludes}
          usage={`<BotFeedback${dark ? ' theme="dark"' : ''} onSubmit={(rating, comment) => save(rating, comment)} />`}
          href={GUMROAD.feedback}
          price={PRICE.feedback}
          onClose={() => setOpen(false)}
          stage={
            <div className="w-full max-w-[360px]">
              <BotFeedback key={round} theme={theme} onSubmit={again} />
            </div>
          }
          options={
            <Choice label={t.theme}>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

// The palette's commands. The tile gets a short list; the pop-up gets them all
const cmdIcon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)
const CMD = {
  project: { id: 'new-project', label: 'New project', group: 'Create', icon: cmdIcon('M12 5v14M5 12h14'), shortcut: ['⌘', 'N'] },
  doc: { id: 'new-doc', label: 'New document', group: 'Create', icon: cmdIcon('M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5'), keywords: ['page', 'file'] },
  invite: { id: 'invite', label: 'Invite teammates', group: 'Create', icon: cmdIcon('M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M19 8v6M16 11h6'), keywords: ['team', 'member'] },
  dashboard: { id: 'dashboard', label: 'Go to dashboard', group: 'Navigate', icon: cmdIcon('M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z'), shortcut: ['G', 'D'] },
  inbox: { id: 'inbox', label: 'Go to inbox', group: 'Navigate', icon: cmdIcon('M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5'), shortcut: ['G', 'I'], hint: '3 new' },
  billing: { id: 'billing', label: 'Billing', group: 'Navigate', icon: cmdIcon('M3 6h18v12H3zM3 10h18M7 15h3'), keywords: ['invoice', 'plan'] },
  theme: {
    id: 'theme', label: 'Change theme', group: 'Settings', icon: cmdIcon('M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z'), keywords: ['dark', 'light', 'appearance'],
    children: [
      { id: 'theme-light', label: 'Light', icon: cmdIcon('M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4') },
      { id: 'theme-dark', label: 'Dark', icon: cmdIcon('M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z') },
      { id: 'theme-system', label: 'System', icon: cmdIcon('M3 5h18v11H3zM8 20h8M12 16v4') },
    ],
  },
  language: {
    id: 'language', label: 'Language', group: 'Settings', icon: cmdIcon('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18'),
    children: ['English', 'Español', 'Nederlands', 'Deutsch', 'Français'].map((l) => ({ id: `lang-${l}`, label: l })),
  },
  logout: { id: 'logout', label: 'Log out', group: 'Settings', icon: cmdIcon('M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H4') },
} satisfies Record<string, CommandItem>
const CMD_SHORT: CommandItem[] = [CMD.project, CMD.invite, CMD.theme]
const CMD_ALL: CommandItem[] = [CMD.project, CMD.doc, CMD.invite, CMD.dashboard, CMD.inbox, CMD.billing, CMD.theme, CMD.language, CMD.logout]

/** 12 · Command palette. An inline palette with a short list on the tile; ⌘K opens the real pop-up from the details. */
function PaletteTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [modal, setModal] = useState(false)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  // The palette's height at rest, measured once: it starts centred, then grows downwards from there
  const inner = useRef<HTMLDivElement>(null)
  const [restH, setRestH] = useState(0)
  useEffect(() => {
    if (inner.current) setRestH(inner.current.offsetHeight)
  }, [])
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(1, (w - 32) / 380)
  const top = restH ? Math.max(12, (w - restH * fit) / 2) : 56
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      {/* Always a white tile; the button switches the palette between white and black */}
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Command palette`} className="absolute inset-0 cursor-pointer" />
        {/* Pinned to the top so it grows downwards as the results change, instead of jumping */}
        <div className="pointer-events-none absolute inset-x-0 flex justify-center" style={{ top }}>
          <div ref={inner} className="pointer-events-auto w-[380px] shrink-0 origin-top" style={{ transform: `scale(${fit})` }}>
            <CommandPalette modal={false} hotkey={false} recents={0} items={CMD_SHORT} theme={theme} placeholder="Type a command…" />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.navigation}
          name="Command palette"
          about={t.paletteAbout}
          includes={t.paletteIncludes}
          usage={`<CommandPalette items={commands}${dark ? ' theme="dark"' : ''} onSelect={(item) => run(item)} />`}
          href={GUMROAD.palette}
          price={PRICE.palette}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex w-full max-w-[520px] flex-col items-center gap-4">
              <CommandPalette modal={false} hotkey={false} items={CMD_ALL} theme={theme} />
              <button
                type="button"
                onClick={() => setModal(true)}
                className={`flex h-8 items-center gap-2 rounded-full px-3 text-[12px] transition-colors ${dark ? 'bg-paper/10 text-paper/70 hover:text-paper' : 'bg-card text-fg-dim hover:text-ink'}`}
              >
                {t.pressK}
              </button>
              {/* The pop-up version, on ⌘K while the details are open */}
              <CommandPalette items={CMD_ALL} theme={theme} open={modal} onOpenChange={setModal} />
            </div>
          }
          options={
            <Choice label={t.theme}>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

// Pretend files for the dropzone; the video is over the 5 MB limit on purpose
const DROP_SAMPLES: SampleFile[] = [
  { name: 'moodboard.png', type: 'image/png', size: 2.4 * 1024 * 1024, color: '#C9B8FF' },
  { name: 'brief.pdf', type: 'application/pdf', size: 860 * 1024 },
  { name: 'launch-film.mp4', type: 'video/mp4', size: 12.6 * 1024 * 1024 },
]
const DROP_MAX = 5 * 1024 * 1024

/** 13 · File drop. The compact dropzone with its sample tray on a white tile; it starts over after each round. */
function DropTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [shape, setShape] = useState<BotShape>('pill')
  const [eyes, setEyes] = useState<BotEyes>('tall')
  const [round, setRound] = useState(0) // a new key = a fresh, empty dropzone
  const box = useRef<HTMLElement>(null)
  const reset = useRef(0)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => {
      ro.disconnect()
      clearTimeout(reset.current)
    }
  }, [])
  const fit = Math.min(1, (w - 32) / 380, (w - 46) / 350)
  const theme = dark ? 'dark' : 'light'
  // Once nothing is uploading any more, clear the tile a little later so it can be tried again
  const settle = (files: { status: string }[]) => {
    clearTimeout(reset.current)
    if (files.length && files.every((f) => f.status !== 'uploading')) reset.current = window.setTimeout(() => setRound((n) => n + 1), 3200)
  }

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} File drop`} className="absolute inset-0 cursor-pointer" />
        {/* Pinned to the top so new rows grow downwards */}
        <div className="pointer-events-none absolute inset-x-0 top-9 flex justify-center">
          <div className="pointer-events-auto w-[380px] shrink-0 origin-top" style={{ transform: `scale(${fit})` }}>
            <FileDrop key={round} compact theme={theme} bot={{ shape, eyes }} maxSize={DROP_MAX} samples={DROP_SAMPLES} onChange={settle} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="File drop"
          about={t.dropAbout}
          includes={t.dropIncludes}
          usage={`<FileDrop${dark ? ' theme="dark"' : ''}${shape !== 'pill' || eyes !== 'tall' ? ` bot={{ shape: '${shape}', eyes: '${eyes}' }}` : ''} maxSize={5 * 1024 * 1024} upload={(file, { onProgress, signal }) => send(file, onProgress, signal)} />`}
          href={GUMROAD.drop}
          price={PRICE.drop}
          onClose={() => setOpen(false)}
          stage={
            <div className="w-full max-w-[420px] self-start pt-4 sm:self-center sm:pt-0">
              <FileDrop theme={theme} bot={{ shape, eyes }} maxSize={DROP_MAX} samples={DROP_SAMPLES} />
            </div>
          }
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              {/* The Bot's body and eyes, like in the Bot's own pop-up (its colour follows the card) */}
              <Choice label={t.shape}>
                {shapes.map((sh) => (
                  <Pick key={sh} on={shape === sh} label={sh} onClick={() => setShape(sh)}>
                    <ShapeIcon shape={sh} />
                  </Pick>
                ))}
              </Choice>
              <Choice label={t.eyes}>
                {eyeKinds.map((e) => (
                  <Pick key={e} on={eyes === e} label={e} onClick={() => setEyes(e)}>
                    <EyesIcon eyes={e} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

// The loader's pretend task: four steps, each a different kind of work
const LOADER_STEPS: LoaderStep[] = [
  { label: 'Reading your file', activity: 'read' },
  { label: 'Thinking it through', activity: 'think' },
  { label: 'Writing the summary', activity: 'work' },
  { label: 'Checking the answer', activity: 'read' },
]

/** Runs the pretend task on a loop. Every third run fails on step 3; Retry starts again, and so does waiting. */
function useLoaderRun(exact: boolean) {
  const [current, setCurrent] = useState(0)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [progress, setProgress] = useState(0)
  const runs = useRef(0)
  const timers = useRef<number[]>([])
  const start = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    runs.current++
    const fail = runs.current % 3 === 0
    setStatus('loading')
    setCurrent(0)
    setProgress(0)
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
    let t = 0
    for (let i = 0; i < LOADER_STEPS.length; i++) {
      const len = 1800 + i * 300
      at(t, () => {
        setCurrent(i)
        setProgress(0)
      })
      for (let k = 1; k <= 10; k++) at(t + (len * k) / 10, () => setProgress(k / 10))
      if (fail && i === 2) {
        at(t + len * 0.6, () => setStatus('error'))
        at(t + len * 0.6 + 4500, start) // nobody pressed Retry: try again
        return
      }
      t += len
    }
    at(t, () => setStatus('done'))
    at(t + 2600, start)
  }
  useEffect(() => {
    start()
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return { current, status, progress: exact ? progress : undefined, retry: start }
}

/** 14 · Bot loader. The card (without its list) running a pretend task on a white tile. */
function LoaderTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [exact, setExact] = useState(false)
  const [shape, setShape] = useState<BotShape>('pill')
  const [eyes, setEyes] = useState<BotEyes>('tall')
  const run = useLoaderRun(exact)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(1, (w - 40) / 300)
  const theme = dark ? 'dark' : 'light'
  const common = { steps: LOADER_STEPS, current: run.current, status: run.status, progress: run.progress, onRetry: run.retry, error: "Couldn't write the summary", theme, bot: { shape, eyes } } as const

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Bot loader`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[300px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <BotLoader {...common} showSteps={false} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.loaders}
          name="Bot loader"
          about={t.loaderAbout}
          includes={t.loaderIncludes}
          usage={`<BotLoader steps={steps} current={step} status={status}${exact ? ' progress={p}' : ''}${dark ? ' theme="dark"' : ''}${shape !== 'pill' || eyes !== 'tall' ? ` bot={{ shape: '${shape}', eyes: '${eyes}' }}` : ''} onRetry={retry} />`}
          href={GUMROAD.loader}
          price={PRICE.loader}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex w-full max-w-[360px] flex-col items-center gap-5 self-start pt-4 sm:self-center sm:pt-0">
              <BotLoader {...common} />
              <BotLoader {...common} variant="inline" error="Couldn't write it" />
            </div>
          }
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.progressLabel}>
                <Pick on={!exact} label={t.unknown} onClick={() => setExact(false)}>
                  <span className="px-1">{t.unknown}</span>
                </Pick>
                <Pick on={exact} label={t.known} onClick={() => setExact(true)}>
                  <span className="px-1">{t.known}</span>
                </Pick>
              </Choice>
              <Choice label={t.shape}>
                {shapes.map((sh) => (
                  <Pick key={sh} on={shape === sh} label={sh} onClick={() => setShape(sh)}>
                    <ShapeIcon shape={sh} />
                  </Pick>
                ))}
              </Choice>
              <Choice label={t.eyes}>
                {eyeKinds.map((e) => (
                  <Pick key={e} on={eyes === e} label={e} onClick={() => setEyes(e)}>
                    <EyesIcon eyes={e} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 15 · OTP input. The compact card on a white tile, with the code to try under it. */
function OtpTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [mask, setMask] = useState(false)
  const [shape, setShape] = useState<BotShape>('pill')
  const [eyes, setEyes] = useState<BotEyes>('tall')
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const fit = Math.min(1, (w - 40) / 360)
  const theme = dark ? 'dark' : 'light'
  // After the right code the tile starts over a little later, empty, so it can be tried again
  const [round, setRound] = useState(0)
  const reset = useRef(0)
  useEffect(() => () => clearTimeout(reset.current), [])
  const verify = async (code: string) => {
    await new Promise((r) => setTimeout(r, 1100))
    const ok = code === '482913'
    if (ok) reset.current = window.setTimeout(() => setRound((n) => n + 1), 3200)
    return ok
  }

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} OTP input`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[360px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <OtpInput key={round} compact theme={theme} mask={mask} bot={{ shape, eyes }} onComplete={verify} />
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[12px] text-fg-faint">{t.tryCode}</p>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.inputs}
          name="OTP input"
          about={t.otpAbout}
          includes={t.otpIncludes}
          usage={`<OtpInput${dark ? ' theme="dark"' : ''}${mask ? ' mask' : ''}${shape !== 'pill' || eyes !== 'tall' ? ` bot={{ shape: '${shape}', eyes: '${eyes}' }}` : ''} sentTo={email} onComplete={(code) => verify(code)} onResend={sendAgain} />`}
          href={GUMROAD.otp}
          price={PRICE.otp}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex w-full max-w-[360px] flex-col items-center gap-4 self-start pt-4 sm:self-center sm:pt-0">
              <OtpInput theme={theme} mask={mask} bot={{ shape, eyes }} sentTo="you@stackd.codes" />
              <p className={dark ? 'text-fg-ghost' : 'text-fg-faint'}>{t.tryCode}</p>
            </div>
          }
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.codeLabel}>
                <Pick on={!mask} label={t.digits} onClick={() => setMask(false)}>
                  <span className="px-1">{t.digits}</span>
                </Pick>
                <Pick on={mask} label={t.dots} onClick={() => setMask(true)}>
                  <span className="px-1">{t.dots}</span>
                </Pick>
              </Choice>
              <Choice label={t.shape}>
                {shapes.map((sh) => (
                  <Pick key={sh} on={shape === sh} label={sh} onClick={() => setShape(sh)}>
                    <ShapeIcon shape={sh} />
                  </Pick>
                ))}
              </Choice>
              <Choice label={t.eyes}>
                {eyeKinds.map((e) => (
                  <Pick key={e} on={eyes === e} label={e} onClick={() => setEyes(e)}>
                    <EyesIcon eyes={e} />
                  </Pick>
                ))}
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

// The picture and a ragged block of glass to start with (8 columns)
const GLASS_SRC = '/glass/street.jpg'
const GLASS_ALT = 'An impressionist street painting'
const GLASS_START = [10, 11, 12, 17, 18, 19, 20, 21, 25, 26, 27, 28, 33, 34, 35, 36, 37, 42, 43]
const GLASS_START_LARGE = [7, 8, 13, 14, 15, 20, 21]

/** 16 · Glass tiles. Just the picture with its glass, cropped square, on a white tile. The pop-up keeps the picture's own shape. */
function GlassTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [thick, setThick] = useState(false)
  const [large, setLarge] = useState(false)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const cardW = Math.round(w - 56)
  const columns = large ? 5 : 8
  const common = { src: GLASS_SRC, alt: GLASS_ALT, columns, strength: thick ? 1 : 0.6, toolbar: false } as const

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Glass tiles`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto" style={{ width: cardW }}>
            <GlassTiles key={columns} {...common} aspect={1} defaultValue={large ? GLASS_START_LARGE : GLASS_START} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.media}
          name="Glass tiles"
          about={t.glassAbout}
          includes={t.glassIncludes}
          usage={`<GlassTiles src="/photo.jpg"${large ? ' columns={5}' : ''}${thick ? ' strength={1}' : ''} toolbar={false} onChange={setTiles} />`}
          href={GUMROAD.glass}
          price={PRICE.glass}
          onClose={() => setOpen(false)}
          stage={
            <div className="w-full max-w-[320px] self-start pt-4 sm:self-center sm:pt-0">
              <GlassTiles key={columns} {...common} defaultValue={large ? GLASS_START_LARGE : GLASS_START} />
            </div>
          }
          options={
            <>
              <Choice label={t.glassLabel}>
                <Pick on={!thick} label={t.soft} onClick={() => setThick(false)}>
                  <span className="px-1">{t.soft}</span>
                </Pick>
                <Pick on={thick} label={t.thick} onClick={() => setThick(true)}>
                  <span className="px-1">{t.thick}</span>
                </Pick>
              </Choice>
              <Choice label={t.tilesLabel}>
                <Pick on={!large} label={t.small} onClick={() => setLarge(false)}>
                  <span className="px-1">{t.small}</span>
                </Pick>
                <Pick on={large} label={t.large} onClick={() => setLarge(true)}>
                  <span className="px-1">{t.large}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

const SWAP_CARDS: SwapCard[] = [
  { id: 'street', title: 'Street', src: '/glass/street.jpg', alt: 'An impressionist street painting' },
  { id: 'autumn', title: 'Autumn', src: '/glass/autumn.jpg', alt: 'An abstract painting in orange and blue' },
  { id: 'strokes', title: 'Strokes', src: '/glass/abstract.jpg', alt: 'An abstract painting with bold strokes' },
]

/** 17 · Card swap. The stack on a white tile, swapping by itself (it stops while the pointer is on it). */
function SwapTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [auto, setAuto] = useState(true)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // The stack's box is exactly what the cards fill: 248 × 300 at the default size
  const fit = Math.min(1, (w - 48) / 248, (w - 48) / 300)
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Card swap`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto shrink-0" style={{ transform: `scale(${fit})` }}>
            <CardSwap cards={SWAP_CARDS} theme={theme} auto={auto} every={3.5} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.media}
          name="Card swap"
          about={t.swapAbout}
          includes={t.swapIncludes}
          usage={`<CardSwap cards={cards}${auto ? ' auto every={3.5}' : ''}${dark ? ' theme="dark"' : ''} onChange={(card) => setFront(card)} />`}
          href={GUMROAD.swap}
          price={PRICE.swap}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex w-full items-center justify-center self-start pt-6 sm:self-center sm:pt-0">
              <CardSwap cards={SWAP_CARDS} theme={theme} auto={auto} every={3.5} />
            </div>
          }
          options={
            <>
              <Choice label={t.pillsLabel}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.autoLabel}>
                <Pick on={auto} label={t.on} onClick={() => setAuto(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!auto} label={t.off} onClick={() => setAuto(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

const COMPARE = {
  before: { src: '/glass/street-raw.jpg', alt: 'The street painting, flat and washed out', label: 'Before' },
  after: { src: '/glass/street.jpg', alt: 'The street painting, in full colour', label: 'After' },
}

/** 18 · Before / after. The slider fills a white tile; drag the jelly line. */
function CompareTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [jelly, setJelly] = useState(true)
  const theme = dark ? 'dark' : 'light'

  return (
    <>
      <article className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Before / after`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-6">
          <div className="pointer-events-auto h-full w-full">
            <BeforeAfter {...COMPARE} theme={theme} jelly={jelly ? 1 : 0} width="100%" height="100%" />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.media}
          name="Before / after"
          about={t.compareAbout}
          includes={t.compareIncludes}
          usage={`<BeforeAfter before={{ src: '/before.jpg' }} after={{ src: '/after.jpg' }}${dark ? ' theme="dark"' : ''}${jelly ? '' : ' jelly={0}'} onChange={setValue} />`}
          href={GUMROAD.compare}
          price={PRICE.compare}
          onClose={() => setOpen(false)}
          stage={
            <div className="aspect-[7/5] w-full max-w-[420px] self-start pt-4 sm:self-center sm:pt-0">
              <BeforeAfter {...COMPARE} theme={theme} jelly={jelly ? 1 : 0} width="100%" height="100%" />
            </div>
          }
          options={
            <>
              <Choice label={t.lineLabel}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.jellyLabel}>
                <Pick on={jelly} label={t.on} onClick={() => setJelly(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!jelly} label={t.off} onClick={() => setJelly(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 19 · Voice memo. The white card on a white tile; trim, play, save. */
function MemoTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const [bot, setBot] = useState(true)
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // The card at its real width, scaled to the tile
  const fit = Math.min(1, (w - 40) / 380)
  const theme = dark ? 'dark' : 'light'
  const memo = (w: string) => <VoiceMemo src="/memo/memo.m4a" defaultStart={1.6} defaultEnd={9.4} theme={theme} bot={bot} width={w} onSave={() => {}} />

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Voice memo`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[380px] shrink-0" style={{ transform: `scale(${fit})` }}>{memo('380px')}</div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.audio}
          name="Voice memo"
          about={t.memoAbout}
          includes={t.memoIncludes}
          usage={`<VoiceMemo src="/memo.m4a"${dark ? ' theme="dark"' : ''}${bot ? '' : ' bot={false}'} onSave={({ start, end }) => trim(start, end)} />`}
          href={GUMROAD.memo}
          price={PRICE.memo}
          onClose={() => setOpen(false)}
          stage={<div className="w-full max-w-[400px] self-start pt-4 sm:self-center sm:pt-0">{memo('100%')}</div>}
          options={
            <>
              <Choice label={t.theme}>
                <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                  <span className="px-1">{t.light}</span>
                </Pick>
                <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                  <span className="px-1">{t.darkT}</span>
                </Pick>
              </Choice>
              <Choice label={t.bot}>
                <Pick on={bot} label={t.on} onClick={() => setBot(true)}>
                  <span className="px-1">{t.on}</span>
                </Pick>
                <Pick on={!bot} label={t.off} onClick={() => setBot(false)}>
                  <span className="px-1">{t.off}</span>
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

/** 20 · World clock. White panels on a white tile; drag a minute hand. */
function ClockTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'auto' | 'dark'>('light')
  const box = useRef<HTMLElement>(null)
  const [w, setW] = useState(280)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // The widget at its real size (340 × ~330), scaled to the tile
  const fit = Math.min(1, (w - 40) / 340)

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} World clock`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto w-[340px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <WorldClock theme={theme} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.widgets}
          name="World clock"
          about={t.clockAbout}
          includes={t.clockIncludes}
          usage={`<WorldClock cities={[{ code: 'AMS', timeZone: 'Europe/Amsterdam' }, { code: 'NYC', timeZone: 'America/New_York' }]}${theme === 'light' ? '' : ` theme="${theme}"`} onChange={setMinutes} />`}
          href={GUMROAD.clock}
          price={PRICE.clock}
          onClose={() => setOpen(false)}
          stage={
            <div className="self-start pt-4 sm:self-center sm:pt-0">
              <WorldClock theme={theme} />
            </div>
          }
          options={
            <Choice label={t.panelsLabel}>
              <Pick on={theme === 'light'} label={t.light} onClick={() => setTheme('light')}>
                <span className="px-1">{t.light}</span>
              </Pick>
              <Pick on={theme === 'auto'} label={t.dayNight} onClick={() => setTheme('auto')}>
                <span className="px-1">{t.dayNight}</span>
              </Pick>
              <Pick on={theme === 'dark'} label={t.darkT} onClick={() => setTheme('dark')}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

/** 21 · Pull to refresh. The sales feed on a white tile; pull it down. */
function PullTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const box = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(280)
  const [h, setH] = useState(440)
  useEffect(() => {
    const el = box.current, c = card.current
    if (!el || !c) return
    const ro = new ResizeObserver(() => { setW(el.clientWidth); setH(c.offsetHeight) })
    ro.observe(el)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  // The phone card at its real size, scaled to fit the tile both ways
  const fit = Math.min(1, (w - 40) / 360, (w - 40) / h)

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Pull to refresh`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div ref={card} className="pointer-events-auto w-[360px] shrink-0" style={{ transform: `scale(${fit})` }}>
            <PullFeed dark={dark} height={300} />
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.loaders}
          name="Pull to refresh"
          about={t.pullAbout}
          includes={t.pullIncludes}
          usage={`<PullToRefresh onRefresh={load}${dark ? ' theme="dark"' : ''} className="h-[480px]">\n  {list}\n</PullToRefresh>`}
          href={GUMROAD.pull}
          price={PRICE.pull}
          onClose={() => setOpen(false)}
          stage={
            <div className="flex flex-col items-center gap-3 self-start pt-4 sm:self-center sm:pt-0">
              <div className="origin-top scale-[.85]"><PullFeed dark={dark} height={420} /></div>
              <p className="-mt-16 text-[12px] text-ink/40">{t.pullHint}</p>
            </div>
          }
          options={
            <Choice label={t.theme}>
              <Pick on={!dark} label={t.light} onClick={() => setDark(false)}>
                <span className="px-1">{t.light}</span>
              </Pick>
              <Pick on={dark} label={t.darkT} onClick={() => setDark(true)}>
                <span className="px-1">{t.darkT}</span>
              </Pick>
            </Choice>
          }
        />
      ) : null}
    </>
  )
}

/** 22 · Activity. The grid on a white tile: a lens in flat, bars in 3D. */
function ActivityTile({ t }: { t: T }) {
  const [open, setOpen] = useState(false)
  const [three, setThree] = useState(false)
  const [olive, setOlive] = useState(false)
  const box = useRef<HTMLElement>(null)
  const card = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(280)
  const [h, setH] = useState(340)
  useEffect(() => {
    const el = box.current, c = card.current
    if (!el || !c) return
    const ro = new ResizeObserver(() => { setW(el.clientWidth); setH(c.offsetHeight) })
    ro.observe(el)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  // The card at its real size (542 wide), scaled to fit the tile both ways
  const fit = Math.min(1, (w - 32) / 542, (w - 32) / h)
  const color = olive ? '#6C8544' : undefined
  // A new key when the view changes in the pop-up, so the grid starts in that view
  const grid = (k: string) => <ActivityGrid key={k + (three ? '3d' : 'flat')} color={color} defaultView={three ? '3d' : 'flat'} />

  return (
    <>
      <article ref={box} className={`group ${tile} bg-paper`}>
        <button type="button" onClick={() => setOpen(true)} aria-label={`${t.open} Activity`} className="absolute inset-0 cursor-pointer" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div ref={card} className="pointer-events-auto shrink-0" style={{ transform: `scale(${fit})` }}>
            {grid('tile')}
          </div>
        </div>
      </article>

      {open ? (
        <Detail
          t={t}
          cat={t.cats.cards}
          name="Activity"
          about={t.activityAbout}
          includes={t.activityIncludes}
          usage={`<ActivityGrid data={days} unit="commits"${three ? ' defaultView="3d"' : ''}${olive ? ' color="#6C8544"' : ''} />`}
          href={GUMROAD.activity}
          price={PRICE.activity}
          onClose={() => setOpen(false)}
          stage={<div className="origin-center scale-[.72] sm:scale-[.8]">{grid('stage')}</div>}
          options={
            <>
              <Choice label={t.viewLabel}>
                <Pick on={!three} label={t.flat} onClick={() => setThree(false)}>
                  <span className="px-1">{t.flat}</span>
                </Pick>
                <Pick on={three} label="3D" onClick={() => setThree(true)}>
                  <span className="px-1">3D</span>
                </Pick>
              </Choice>
              <Choice label={t.colourLabel}>
                <Pick on={!olive} label="Ink" onClick={() => setOlive(false)}>
                  <Swatch color="#141310" />
                </Pick>
                <Pick on={olive} label="Olive" onClick={() => setOlive(true)}>
                  <Swatch color="#6C8544" />
                </Pick>
              </Choice>
            </>
          }
        />
      ) : null}
    </>
  )
}

function Swatch({ color }: { color: string }) {
  return <span className="block h-3.5 w-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(20,19,16,0.15)]" style={{ background: color }} />
}

