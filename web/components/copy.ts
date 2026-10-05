/**
 * Copy EN/ES de la landing. StackD es la práctica freelance de Arnau
 * (reposicionado el 5 oct 2026: antes era "estudio de IA para inmobiliarias").
 * Primera persona y solo trabajo real, para que cuadre con LinkedIn.
 */

export const COPY = {
  en: {
    nav: { work: 'Work', services: 'Services', contact: 'Contact' },
    hero: {
      body: "StackD is the freelance practice of Arnau López, a full-stack software developer. I design, build and ship web apps, mobile apps and AI features, from the first screen to production.",
      studio: '[ Freelance ]',
      location: '[ Spain / Remote EU ]',
    },
    stats: {
      items: [
        { v: '2', l: 'apps live on the App Store' },
        { v: '1', l: 'B2B SaaS running in production' },
        { v: '1', l: 'person on the whole stack: design, backend, release' },
      ],
      source: 'Counted from the shipped work below',
    },
    services: {
      eyebrow: 'What I do',
      items: [
        {
          t: 'Web apps',
          tags: ['Next.js & TypeScript', 'APIs & databases', 'Deployed & monitored'],
          stat: 'From the first screen to the production database: auth, payments, admin panels, the parts that make it real.',
        },
        {
          t: 'Mobile apps',
          tags: ['React Native & Expo', 'iOS release', 'App Store review'],
          stat: 'Two apps taken through App Store review and live in the store.',
        },
        {
          t: 'AI features',
          tags: ['LLM integrations', 'Voice & agents', 'Human in the loop'],
          stat: 'Agents that act inside your product, with a clear line between what runs on its own and what waits for a person.',
        },
      ],
    },
    works: {
      marquee: 'Work',
      rows: [
        {
          which: 'blockflow' as const,
          index: '01',
          caption: 'SaaS for UK property managers. An AI voice agent answers out-of-hours calls, triages them and opens the ticket.',
        },
        {
          which: 'kiblo' as const,
          index: '02',
          caption: 'iOS app for dog owners: scan a food, get a grade and the exact daily portion. Live on the App Store.',
        },
        {
          which: 'trace' as const,
          index: '03',
          caption: 'Privacy app that finds where your data is exposed and sends the GDPR/CCPA deletion requests for you. Live on the App Store.',
        },
        {
          which: 'dross' as const,
          index: '04',
          caption: 'Native Mac app and CLI that checks a repo before deploy and catches drift between frontend and backend.',
        },
      ],
    },
    values: {
      title: 'How I work',
      body: 'Three rules for every project I take on.',
      items: [
        { t: 'Production, not demos', d: "If it doesn't run with real users, it isn't done. I ship it, deploy it and stay on to fix what breaks." },
        { t: 'One person, whole stack', d: 'Design, frontend, backend and release. You talk to the person writing the code, no handoffs.' },
        { t: 'You own it', d: 'Full code and IP transfer when we finish. A clean, documented repo and no lock-in.' },
      ],
    },
    process: {
      title: 'How a project runs',
      steps: [
        { t: 'Call', d: 'We talk about the problem, not the feature list.' },
        { t: 'Scope & price', d: 'A short written scope and a fixed price, or a retainer.' },
        { t: 'Build', d: 'Weekly builds you can open and use, not status reports.' },
        { t: 'Launch', d: 'Deployed, store review handled, code and IP handed over.' },
      ],
    },
    techStack: { eyebrow: 'What I build with' },
    faq: {
      eyebrow: 'FAQ',
      title: 'Questions clients ask',
      items: [
        {
          q: 'How fast can you start?',
          a: 'Usually within a week of the first call. I take a small number of projects at a time so each one gets full attention.',
        },
        {
          q: 'Who owns the code?',
          a: 'You do. Full IP transfer when the project ends, no exceptions.',
        },
        {
          q: 'How do you charge?',
          a: "A fixed price for a defined scope, or a monthly retainer for ongoing work. I'll suggest one after we talk.",
        },
        {
          q: 'Do you sign NDAs?',
          a: 'Yes. Happy to sign yours before you share anything sensitive.',
        },
        {
          q: 'Is it just you?',
          a: 'Yes. StackD is my freelance practice, so you work directly with me from the first call to launch.',
        },
      ],
    },
    contact: {
      eyebrow: 'Have a project?',
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
      body: 'StackD es la práctica freelance de Arnau López, desarrollador de software full-stack. Diseño, construyo y lanzo aplicaciones web, apps móviles y funciones de IA, desde la primera pantalla hasta producción.',
      studio: '[ Freelance ]',
      location: '[ España / Remoto UE ]',
    },
    stats: {
      items: [
        { v: '2', l: 'apps publicadas en la App Store' },
        { v: '1', l: 'SaaS B2B funcionando en producción' },
        { v: '1', l: 'persona en todo el stack: diseño, backend, lanzamiento' },
      ],
      source: 'Contado a partir del trabajo publicado más abajo',
    },
    services: {
      eyebrow: 'Qué hago',
      items: [
        {
          t: 'Aplicaciones web',
          tags: ['Next.js y TypeScript', 'APIs y bases de datos', 'Desplegado y monitorizado'],
          stat: 'De la primera pantalla a la base de datos en producción: login, pagos, paneles de administración, lo que hace que sea real.',
        },
        {
          t: 'Apps móviles',
          tags: ['React Native y Expo', 'Lanzamiento iOS', 'Revisión de App Store'],
          stat: 'Dos apps que han pasado la revisión de Apple y están publicadas.',
        },
        {
          t: 'Funciones de IA',
          tags: ['Integración de LLMs', 'Voz y agentes', 'Persona en el circuito'],
          stat: 'Agentes que actúan dentro de tu producto, con una línea clara entre lo que hacen solos y lo que espera a una persona.',
        },
      ],
    },
    works: {
      marquee: 'Trabajo',
      rows: [
        {
          which: 'blockflow' as const,
          index: '01',
          caption: 'SaaS para administradores de fincas en Reino Unido. Un agente de voz IA atiende las llamadas fuera de horario, hace triaje y abre el ticket.',
        },
        {
          which: 'kiblo' as const,
          index: '02',
          caption: 'App iOS para dueños de perros: escanea un pienso, obtén su nota y la ración diaria exacta. Publicada en la App Store.',
        },
        {
          which: 'trace' as const,
          index: '03',
          caption: 'App de privacidad que encuentra dónde están expuestos tus datos y envía por ti las solicitudes de borrado GDPR/CCPA. Publicada en la App Store.',
        },
        {
          which: 'dross' as const,
          index: '04',
          caption: 'App nativa de Mac y CLI que revisa un repo antes de desplegar y detecta desajustes entre frontend y backend.',
        },
      ],
    },
    values: {
      title: 'Cómo trabajo',
      body: 'Tres reglas para cada proyecto que acepto.',
      items: [
        { t: 'Producción, no demos', d: 'Si no funciona con usuarios reales, no está terminado. Lo lanzo, lo despliego y sigo ahí para arreglar lo que falle.' },
        { t: 'Una persona, todo el stack', d: 'Diseño, frontend, backend y lanzamiento. Hablas con quien escribe el código, sin intermediarios.' },
        { t: 'Es tuyo', d: 'Cesión completa del código y la propiedad intelectual al terminar. Un repo limpio, documentado y sin ataduras.' },
      ],
    },
    process: {
      title: 'Cómo va un proyecto',
      steps: [
        { t: 'Llamada', d: 'Hablamos del problema, no de la lista de funciones.' },
        { t: 'Alcance y precio', d: 'Un alcance corto por escrito y precio cerrado, o un retainer.' },
        { t: 'Construcción', d: 'Versiones semanales que puedes abrir y usar, no informes de estado.' },
        { t: 'Lanzamiento', d: 'Desplegado, revisión de la tienda hecha, código y propiedad entregados.' },
      ],
    },
    techStack: { eyebrow: 'Con qué construyo' },
    faq: {
      eyebrow: 'FAQ',
      title: 'Preguntas frecuentes de clientes',
      items: [
        {
          q: '¿Con qué rapidez puedes empezar?',
          a: 'Normalmente en una semana desde la primera llamada. Llevo pocos proyectos a la vez para que cada uno tenga toda mi atención.',
        },
        {
          q: '¿De quién es el código?',
          a: 'Tuyo. Cesión completa de la propiedad intelectual al terminar, sin excepciones.',
        },
        {
          q: '¿Cómo cobras?',
          a: 'Precio cerrado para un alcance definido, o un retainer mensual para trabajo continuo. Te recomiendo uno después de hablar.',
        },
        {
          q: '¿Firmas NDA?',
          a: 'Sí. Firmo el tuyo antes de que compartas nada sensible.',
        },
        {
          q: '¿Eres solo tú?',
          a: 'Sí. StackD es mi práctica freelance, así que trabajas directamente conmigo desde la primera llamada hasta el lanzamiento.',
        },
      ],
    },
    contact: {
      eyebrow: '¿Tienes un proyecto?',
      title: '¡Hablemos!',
      name: 'Nombre',
      email: 'Email',
      message: 'Mensaje',
      send: 'Enviar',
    },
  },
} as const
