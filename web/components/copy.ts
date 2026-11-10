/**
 * Copy EN/ES de la landing. 10 nov 2026: StackD pasa de "práctica freelance" a estudio
 * (enfoque agencia), pero en primera persona: lo lleva Arnau solo y no se finge un equipo.
 * Trabajo principal (con experiencia): Hilo, Aithority, Casa. Otros proyectos: Kiblo, Dross.
 * BlockFlow y TRACE fuera, como en el CV y el portfolio. Solo hechos ciertos.
 */

export type ProjectId = 'hilo' | 'aithority' | 'casa' | 'kiblo' | 'dross'

/** Image and link per project: the same in both languages */
export const PROJECTS: Record<
  ProjectId,
  { name: string; image: string; w: number; h: number; link: string; certificate?: string; stack: string[] }
> = {
  hilo: {
    name: 'Hilo',
    image: '/work/hilo.webp',
    w: 2400,
    h: 1552,
    link: 'https://hilo-web.vercel.app',
    stack: ['React Native', 'TypeScript', 'Supabase', 'Claude API', 'Azure Speech'],
  },
  aithority: {
    name: 'Aithority',
    image: '/work/aithority.webp',
    w: 1600,
    h: 1142,
    link: 'https://www.aithority.com.es',
    stack: ['Next.js', 'Node', 'Turso', 'Microsoft Graph', 'Claude Haiku'],
  },
  casa: {
    name: 'Casa',
    image: '/work/casa.webp',
    w: 1600,
    h: 1143,
    link: 'https://github.com/lopezsellesarnau-cmd/before-you-pay',
    certificate: '/certificates/open-agent-hackathon-2026.pdf',
    stack: ['TypeScript', 'Node', 'NVIDIA Nemotron', 'Zetaris', 'Catastro API'],
  },
  kiblo: {
    name: 'Kiblo',
    image: '/work/kiblo.webp',
    w: 2400,
    h: 1552,
    link: 'https://apps.apple.com/app/id6802237827',
    stack: ['React Native', 'Expo', 'Firebase', 'RevenueCat'],
  },
  dross: {
    name: 'Dross',
    image: '/work/dross.webp',
    w: 1600,
    h: 1142,
    link: 'https://github.com/lopezsellesarnau-cmd/dross',
    stack: ['SwiftUI', 'TypeScript', 'TS compiler API'],
  },
}

/** From his Y Combinator co-founder matching profile (10 nov 2026) */
export const QUOTE = {
  text: 'Arnau has an impressive CV of products, all built & shipped solo!',
  who: 'Alistair Stafford',
  where: 'Y Combinator · co-founder matching',
}

export const COPY = {
  en: {
    nav: { plans: 'Plans', work: 'Work', process: 'Process', contact: 'Contact', components: 'Components' },
    hero: {
      title: 'Software and AI for companies that need it to work.',
      body: 'StackD is the studio of Arnau López. I design and build web apps, mobile apps and AI features, and take them all the way to production.',
      cta: 'Start a project',
      plans: 'See the plans',
      meta: ['Amsterdam, Netherlands', 'Remote across the EU', 'Taking new projects'],
    },
    work: {
      label: 'Selected work',
      did: 'What I did',
      open: 'Open',
      certificate: 'Certificate',
      items: [
        {
          id: 'hilo' as const,
          role: 'Cofounder · Product Engineer',
          when: '2026, now',
          kind: 'iPhone, iPad and web app · AI voice',
          summary:
            'A voice app for older people who live alone. It talks with them every day, reminds them about their pills and turns their stories into a book for the family. Care organisations get a web app that shows who to call today.',
          did: [
            'Product design in Figma and the whole build: iPhone, iPad and two web apps',
            'The daily voice talk with Claude and Azure Speech, on Supabase in the EU',
            'Subscriptions on iPhone and web, now in App Store review',
          ],
        },
        {
          id: 'aithority' as const,
          role: 'Cofounder · Product Engineer',
          when: 'May to Oct 2026',
          kind: 'B2B SaaS · EU AI Act',
          summary:
            'EU AI Act compliance for companies that use AI in hiring, credit or biometrics: an inventory of their AI systems, the risk class of each one and dated evidence. Accepted into the Lanzadera accelerator.',
          did: [
            'Backend, frontend and the integrations with Microsoft 365, Google Workspace and AI provider APIs',
            'Onboarding cut from over seven minutes to three steps',
            'A PDF report the customer can send to their own clients',
          ],
        },
        {
          id: 'casa' as const,
          role: 'Backend & AI · team of three',
          when: 'Oct 2026',
          kind: 'AI agents · Open Agent Hackathon',
          summary:
            'Agents that check a rental listing in Spain before you pay: the size against Catastro, the price against the official rent index, the fees against the law, and signs of a scam. Built in six days.',
          did: [
            'The backend, the data and the agents, in a remote team across countries',
            'A planner, specialist agents and a critic that drops any finding without a source',
            'Live data from Catastro and the official SERPAVI rent index',
          ],
        },
      ],
    },
    other: {
      label: 'Other projects',
      items: [
        {
          id: 'kiblo' as const,
          kind: 'iOS app',
          summary: 'Scan the dog food bag, portion the meal from the dog’s weight and reorder before it runs out. Live on the App Store in the US and Canada.',
        },
        {
          id: 'dross' as const,
          kind: 'Mac app and CLI',
          summary: 'Catches the moment a frontend and its backend stop agreeing, before deploy. Notarized and open source.',
        },
      ],
    },
    plans: {
      label: 'Plans',
      note: 'Fixed price after a first call',
      intro: 'Three ways to work together, from the first screen to a product live with real users.',
      includes: 'Includes',
      get: 'You get',
      items: [
        {
          t: 'Design',
          for: 'For when the product needs to be figured out before anyone writes code.',
          includes: ['User flows and UX', 'Screens in Figma', 'A clickable prototype', 'A small design system with components'],
          get: 'A Figma file any developer can build from',
        },
        {
          t: 'Design + Build',
          for: 'Product engineering: I design it and I write the code.',
          includes: ['Everything in Design', 'Web app or iPhone app in code', 'Backend, database and sign in', 'AI features: voice, agents, LLMs', 'Weekly versions you can open and use'],
          get: 'A working product and the full repo',
        },
        {
          t: 'Launch',
          for: 'Designed, built and live with real users.',
          includes: [
            'Everything in Design + Build',
            'App Store release through the Apple Developer Program',
            'SaaS live on your own domain',
            'Subscriptions and payments',
            'Hosting, monitoring and store review handled',
          ],
          get: 'A live product, with code and IP handed over',
        },
      ],
      after: 'After launch: support and new features as a monthly retainer.',
    },
    process: {
      label: 'How a project runs',
      steps: [
        { t: 'Call', d: 'We talk about the problem, not the feature list.' },
        { t: 'Scope and price', d: 'A short written scope and a fixed price, or a monthly retainer.' },
        { t: 'Build', d: 'Weekly versions you can open and use, not status reports.' },
        { t: 'Launch', d: 'Deployed, store review handled, code and IP handed over.' },
      ],
    },
    faq: {
      label: 'Questions',
      items: [
        { q: 'Is it just you?', a: 'Yes. StackD is my studio, so you work directly with the person who writes the code, from the first call to launch.' },
        { q: 'How fast can you start?', a: 'Usually within a week of the first call. I take a small number of projects at a time.' },
        { q: 'How do you charge?', a: 'A fixed price for a defined scope, or a monthly retainer for ongoing work. I suggest one after we talk.' },
        { q: 'Who owns the code?', a: 'You do. Full code and IP transfer when the project ends.' },
        { q: 'Where are you based?', a: 'In Amsterdam. I work remotely with companies across the EU, in English or Spanish.' },
      ],
    },
    contact: {
      title: 'Have a project?',
      body: 'Tell me what you need to build, and we set up a first call.',
      name: 'Name',
      email: 'Email',
      message: 'What do you need?',
      send: 'Send',
      sent: (email: string) => `Your mail app should have opened. If not, write to ${email}.`,
    },
  },
  es: {
    nav: { plans: 'Planes', work: 'Trabajo', process: 'Proceso', contact: 'Contacto', components: 'Componentes' },
    hero: {
      title: 'Software e IA para empresas que necesitan que funcione.',
      body: 'StackD es el estudio de Arnau López. Diseño y construyo aplicaciones web, apps móviles y funciones de IA, y las llevo hasta producción.',
      cta: 'Empezar un proyecto',
      plans: 'Ver los planes',
      meta: ['Ámsterdam, Países Bajos', 'En remoto en toda la UE', 'Con hueco para proyectos'],
    },
    work: {
      label: 'Trabajo destacado',
      did: 'Qué hice',
      open: 'Abrir',
      certificate: 'Certificado',
      items: [
        {
          id: 'hilo' as const,
          role: 'Cofundador · Product Engineer',
          when: '2026, ahora',
          kind: 'App iPhone, iPad y web · voz con IA',
          summary:
            'Una app de voz para personas mayores que viven solas. Charla con ellas cada día, les recuerda las pastillas y convierte sus historias en un libro para la familia. Las organizaciones de cuidado tienen una web que les dice a quién llamar hoy.',
          did: [
            'Diseño del producto en Figma y todo el desarrollo: iPhone, iPad y dos webs',
            'La charla diaria por voz con Claude y Azure Speech, sobre Supabase en la UE',
            'Suscripciones en iPhone y web, ahora en revisión de la App Store',
          ],
        },
        {
          id: 'aithority' as const,
          role: 'Cofundador · Product Engineer',
          when: 'Mayo a oct 2026',
          kind: 'SaaS B2B · AI Act de la UE',
          summary:
            'Cumplimiento del AI Act para empresas que usan IA en selección, crédito o biometría: inventario de sus sistemas de IA, la clase de riesgo de cada uno y evidencias con fecha. Aceptada en la aceleradora Lanzadera.',
          did: [
            'Backend, frontend y las integraciones con Microsoft 365, Google Workspace y las APIs de proveedores de IA',
            'Onboarding reducido de más de siete minutos a tres pasos',
            'Un informe en PDF que el cliente puede enviar a sus propios clientes',
          ],
        },
        {
          id: 'casa' as const,
          role: 'Backend e IA · equipo de tres',
          when: 'Oct 2026',
          kind: 'Agentes de IA · Open Agent Hackathon',
          summary:
            'Agentes que revisan un anuncio de alquiler en España antes de pagar: los metros contra el Catastro, el precio contra el índice oficial, los gastos contra la ley y señales de estafa. Hecho en seis días.',
          did: [
            'El backend, los datos y los agentes, en un equipo remoto de varios países',
            'Un planificador, agentes especialistas y un crítico que descarta todo hallazgo sin fuente',
            'Datos en vivo del Catastro y del índice oficial de alquiler SERPAVI',
          ],
        },
      ],
    },
    other: {
      label: 'Otros proyectos',
      items: [
        {
          id: 'kiblo' as const,
          kind: 'App iOS',
          summary: 'Escanea el saco de pienso, calcula la ración por el peso del perro y vuelve a pedir antes de que se acabe. Publicada en la App Store de EE. UU. y Canadá.',
        },
        {
          id: 'dross' as const,
          kind: 'App Mac y CLI',
          summary: 'Detecta cuándo un frontend y su backend dejan de entenderse, antes de desplegar. Notarizada y de código abierto.',
        },
      ],
    },
    plans: {
      label: 'Planes',
      note: 'Precio cerrado tras una primera llamada',
      intro: 'Tres formas de trabajar juntos, de la primera pantalla a un producto en producción con usuarios reales.',
      includes: 'Incluye',
      get: 'Te llevas',
      items: [
        {
          t: 'Diseño',
          for: 'Para cuando hay que definir el producto antes de escribir código.',
          includes: ['Flujos de usuario y UX', 'Pantallas en Figma', 'Un prototipo navegable', 'Un pequeño sistema de diseño con componentes'],
          get: 'Un archivo de Figma listo para que cualquier desarrollador lo construya',
        },
        {
          t: 'Diseño + Desarrollo',
          for: 'Product engineering: lo diseño y escribo el código.',
          includes: ['Todo lo de Diseño', 'App web o app de iPhone en código', 'Backend, base de datos y login', 'Funciones de IA: voz, agentes, LLMs', 'Versiones semanales que puedes abrir y usar'],
          get: 'Un producto que funciona y el repositorio completo',
        },
        {
          t: 'Lanzamiento',
          for: 'Diseñado, construido y en producción con usuarios reales.',
          includes: [
            'Todo lo de Diseño + Desarrollo',
            'Publicación en la App Store con el Apple Developer Program',
            'SaaS en tu propio dominio',
            'Suscripciones y pagos',
            'Hosting, monitorización y revisión de la tienda',
          ],
          get: 'Un producto en producción, con el código y la propiedad entregados',
        },
      ],
      after: 'Después del lanzamiento: soporte y nuevas funciones con un retainer mensual.',
    },
    process: {
      label: 'Cómo va un proyecto',
      steps: [
        { t: 'Llamada', d: 'Hablamos del problema, no de la lista de funciones.' },
        { t: 'Alcance y precio', d: 'Un alcance corto por escrito y precio cerrado, o un retainer mensual.' },
        { t: 'Construcción', d: 'Versiones semanales que puedes abrir y usar, no informes de estado.' },
        { t: 'Lanzamiento', d: 'Desplegado, revisión de la tienda hecha, código y propiedad entregados.' },
      ],
    },
    faq: {
      label: 'Preguntas',
      items: [
        { q: '¿Eres solo tú?', a: 'Sí. StackD es mi estudio, así que trabajas directamente con quien escribe el código, desde la primera llamada hasta el lanzamiento.' },
        { q: '¿Cuándo puedes empezar?', a: 'Normalmente en una semana desde la primera llamada. Llevo pocos proyectos a la vez.' },
        { q: '¿Cómo cobras?', a: 'Precio cerrado para un alcance definido, o un retainer mensual para trabajo continuo. Te recomiendo uno después de hablar.' },
        { q: '¿De quién es el código?', a: 'Tuyo. Cesión completa del código y la propiedad intelectual al terminar.' },
        { q: '¿Dónde estás?', a: 'En Ámsterdam. Trabajo en remoto con empresas de toda la UE, en inglés o en español.' },
      ],
    },
    contact: {
      title: '¿Tienes un proyecto?',
      body: 'Cuéntame qué necesitas construir y quedamos para una primera llamada.',
      name: 'Nombre',
      email: 'Email',
      message: '¿Qué necesitas?',
      send: 'Enviar',
      sent: (email: string) => `Se habrá abierto tu correo. Si no, escríbeme a ${email}.`,
    },
  },
}

export type Copy = (typeof COPY)['en']
