/**
 * Copy EN/ES de la landing. Sin mención a "UK" en ninguna de las dos —
 * quitado a petición explícita (el posicionamiento ya no es "small studio
 * in the UK", se deja genérico).
 */

export const COPY = {
  en: {
    nav: { work: 'Work', services: 'Services', contact: 'Contact' },
    hero: {
      body: 'We design and build AI software that ships to production — automations, agents and full products for businesses who are tired of slide decks.',
      studio: '[ Studio ]',
      location: '[ Barcelona ]',
    },
    services: {
      eyebrow: 'Here is how we help',
      items: [
        { t: 'Automation', tags: ['Process design', 'Ops workflows', 'Integrations'] },
        { t: 'AI Agents', tags: ['Voice & chat', 'Custom LLM pipelines', 'Live systems'] },
        { t: 'Product', tags: ['Full-stack SaaS', 'Design systems', '0 to production'] },
      ],
    },
    works: {
      marquee: 'Works',
      rows: [
        {
          which: 'volea' as const,
          index: '01',
          caption: 'A real-time booking flow for padel clubs — availability, payments and confirmations, live.',
        },
        {
          which: 'blockflow' as const,
          index: '02',
          caption: 'An AI voice agent for property managers: it answers, triages and creates the ticket, unattended.',
        },
        {
          which: 'recruiting' as const,
          index: '03',
          caption: 'A screening agent for recruiters: scores and triages inbound applicants before a human looks at them.',
        },
        {
          which: 'marketing' as const,
          index: '04',
          caption: 'A campaign agent for marketing agencies: drafts and queues ad copy across channels, client just approves.',
        },
      ],
    },
    trackRecord: {
      title: 'Track record',
      body: 'Small studio, shipped repeatedly. Every line below is live or was, end to end.',
      rows: [
        ['BlockFlow', 'AI voice agent — live in production', '2026'],
        ['Volea', 'Booking SaaS — real-time payments', '2026'],
        ['Fincas Pro', 'Property management platform', '2025'],
        ['SMASH', 'Social app — App Store review', '2026'],
      ],
    },
    techStack: { eyebrow: 'What we build with' },
    faq: {
      eyebrow: 'FAQ',
      title: 'Questions clients ask',
      items: [
        {
          q: 'How fast can you start?',
          a: 'Usually within a week of the discovery call. We keep a small client roster on purpose so we can move fast when a new project starts.',
        },
        {
          q: 'Who owns the code?',
          a: "You do — full IP transfer on completion, no exceptions. It's your product, we're the ones building it.",
        },
        {
          q: "What's the engagement model?",
          a: "Either project-based (fixed scope, fixed price) or a monthly retainer for ongoing build and maintenance. We'll recommend one after the discovery call.",
        },
        {
          q: 'Do you sign NDAs?',
          a: 'Yes, happy to sign yours or use ours. Standard practice before we look at anything sensitive.',
        },
        {
          q: 'Do you work with non-technical founders?',
          a: "Most of our clients are. We handle the full stack — product, design, engineering and AI — so you don't need an in-house technical team to ship.",
        },
      ],
    },
    contact: {
      eyebrow: 'Have an idea?',
      title: "Let's talk!",
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send',
    },
  },
  es: {
    nav: { work: 'Trabajo', services: 'Servicios', contact: 'Contacto' },
    hero: {
      body: 'Diseñamos y construimos software de IA que llega a producción — automatizaciones, agentes y productos completos para negocios cansados de presentaciones que no se usan.',
      studio: '[ Estudio ]',
      location: '[ Barcelona ]',
    },
    services: {
      eyebrow: 'Así ayudamos',
      items: [
        { t: 'Automatización', tags: ['Diseño de procesos', 'Flujos operativos', 'Integraciones'] },
        { t: 'Agentes IA', tags: ['Voz y chat', 'Pipelines LLM a medida', 'Sistemas en producción'] },
        { t: 'Producto', tags: ['SaaS full-stack', 'Sistemas de diseño', 'De 0 a producción'] },
      ],
    },
    works: {
      marquee: 'Trabajo',
      rows: [
        {
          which: 'volea' as const,
          index: '01',
          caption: 'Reservas en tiempo real para clubes de pádel — disponibilidad, pagos y confirmaciones, en vivo.',
        },
        {
          which: 'blockflow' as const,
          index: '02',
          caption: 'Un agente de voz IA para administradores de fincas: responde, triaje y crea el ticket, sin nadie detrás.',
        },
        {
          which: 'recruiting' as const,
          index: '03',
          caption: 'Un agente de cribado para reclutadoras: puntúa y clasifica candidaturas entrantes antes de que las vea una persona.',
        },
        {
          which: 'marketing' as const,
          index: '04',
          caption: 'Un agente de campañas para agencias de marketing: redacta y encola copys por canal, el cliente solo aprueba.',
        },
      ],
    },
    trackRecord: {
      title: 'Trayectoria',
      body: 'Estudio pequeño, entregas repetidas. Cada línea de abajo está en producción o lo estuvo, de principio a fin.',
      rows: [
        ['BlockFlow', 'Agente de voz IA — en producción', '2026'],
        ['Volea', 'SaaS de reservas — pagos en tiempo real', '2026'],
        ['Fincas Pro', 'Plataforma de gestión de fincas', '2025'],
        ['SMASH', 'App social — en revisión de la App Store', '2026'],
      ],
    },
    techStack: { eyebrow: 'Con qué construimos' },
    faq: {
      eyebrow: 'FAQ',
      title: 'Preguntas frecuentes de clientes',
      items: [
        {
          q: '¿Con qué rapidez podéis empezar?',
          a: 'Normalmente en una semana desde la llamada inicial. Mantenemos pocos clientes a propósito para movernos rápido cuando arranca un proyecto nuevo.',
        },
        {
          q: '¿De quién es el código?',
          a: 'Tuyo — cesión completa de la propiedad intelectual al terminar, sin excepciones. Es tu producto, nosotros lo construimos.',
        },
        {
          q: '¿Cuál es el modelo de colaboración?',
          a: 'Por proyecto (alcance y precio cerrados) o retainer mensual para desarrollo y mantenimiento continuo. Te recomendamos uno tras la llamada inicial.',
        },
        {
          q: '¿Firmáis NDA?',
          a: 'Sí, con gusto firmamos el tuyo o usamos el nuestro. Práctica estándar antes de ver cualquier cosa sensible.',
        },
        {
          q: '¿Trabajáis con fundadores no técnicos?',
          a: 'La mayoría de nuestros clientes lo son. Cubrimos todo el stack — producto, diseño, ingeniería e IA — para que no necesites equipo técnico propio para lanzar.',
        },
      ],
    },
    contact: {
      eyebrow: '¿Tienes una idea?',
      title: '¡Hablemos!',
      name: 'Nombre',
      email: 'Email',
      message: 'Mensaje',
      send: 'Enviar',
    },
  },
} as const
