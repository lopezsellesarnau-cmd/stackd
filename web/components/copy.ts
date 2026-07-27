/**
 * Copy EN/ES de la landing. Sin mención a "UK" en ninguna de las dos —
 * quitado a petición explícita (el posicionamiento ya no es "small studio
 * in the UK", se deja genérico).
 */

export const COPY = {
  en: {
    nav: { work: 'Work', services: 'Services', contact: 'Contact' },
    hero: {
      body: 'We build AI systems for real estate agencies — instant lead response, virtual staging and video for every listing, generated in minutes, not days.',
      studio: '[ Studio ]',
      location: '[ Barcelona ]',
    },
    stats: {
      items: [
        { v: '78%', l: 'of buyers go with whoever responds first' },
        { v: '21×', l: 'more likely to convert in 5 min vs. 30' },
        { v: '$7,500+', l: 'lost commission per missed lead' },
      ],
      source: 'NAR & industry lead-response studies, 2025–26',
    },
    services: {
      eyebrow: 'Here is how we help',
      items: [
        {
          t: 'Lead Response',
          tags: ['WhatsApp & calls', 'Instant qualification', 'Viewings booked'],
          stat: '62% of enquiries arrive outside business hours — the average agent still takes 47 minutes to reply.',
        },
        {
          t: 'Content Engine',
          tags: ['Virtual staging', 'AI video clips', 'Ready for social'],
          stat: "Agencies already pay $16–75 per photo for staging. Same spend, same day, done for you.",
        },
        { t: 'Growth Retainer', tags: ['Ongoing listings', 'Monthly pipeline', 'One point of contact'] },
      ],
    },
    works: {
      marquee: 'Works',
      rows: [
        {
          which: 'blockflow' as const,
          index: '01',
          caption: 'An AI voice agent for property managers: it answers, triages and creates the ticket, unattended.',
        },
        {
          which: 'staging' as const,
          index: '02',
          caption: 'A content engine for listings: upload photos, get virtual staging, a short vertical video clip and copy, same day.',
        },
        {
          which: 'leadagent' as const,
          index: '03',
          caption: 'An agent that answers portal enquiries in seconds, qualifies budget and books the viewing.',
        },
      ],
    },
    values: {
      title: 'What we stand for',
      body: 'Three things that shape every property system we ship, and why we build them at all.',
      items: [
        { t: 'Tech', d: 'AI-native, not a chatbot bolted on. Every system we ship learns and improves with data of its own.' },
        { t: 'Eco', d: 'Less waste, less friction. We help agencies market and manage properties built to weigh less on the planet.' },
        { t: 'Contemporary', d: "Design and software as of today, not a template from five years ago." },
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
      body: 'Construimos sistemas de IA para agencias inmobiliarias — respuesta instantánea a leads, staging virtual y vídeo para cada propiedad, generados en minutos, no en días.',
      studio: '[ Estudio ]',
      location: '[ Barcelona ]',
    },
    stats: {
      items: [
        { v: '78%', l: 'de compradores va con quien responde primero' },
        { v: '21×', l: 'más probable cerrar en 5 min vs. 30' },
        { v: '7.500 €+', l: 'de comisión perdida por cada lead sin responder' },
      ],
      source: 'NAR y estudios de sector sobre tiempo de respuesta, 2025–26',
    },
    services: {
      eyebrow: 'Así ayudamos',
      items: [
        {
          t: 'Lead Response',
          tags: ['WhatsApp y llamadas', 'Cualificación instantánea', 'Visitas agendadas'],
          stat: 'El 62% de las consultas llegan fuera de horario — la media de un agente sigue siendo 47 minutos para responder.',
        },
        {
          t: 'Content Engine',
          tags: ['Staging virtual', 'Clips de vídeo IA', 'Listo para redes'],
          stat: 'Las agencias ya pagan 16–75€ por foto de staging. Mismo gasto, mismo día, sin que muevas un dedo.',
        },
        { t: 'Growth Retainer', tags: ['Propiedades continuas', 'Pipeline mensual', 'Un único contacto'] },
      ],
    },
    works: {
      marquee: 'Trabajo',
      rows: [
        {
          which: 'blockflow' as const,
          index: '01',
          caption: 'Un agente de voz IA para administradores de fincas: responde, triaje y crea el ticket, sin nadie detrás.',
        },
        {
          which: 'staging' as const,
          index: '02',
          caption: 'Un motor de contenido para inmuebles: sube fotos, obtén staging virtual, un clip de vídeo vertical y copy, el mismo día.',
        },
        {
          which: 'leadagent' as const,
          index: '03',
          caption: 'Un agente que responde en segundos a consultas del portal, cualifica presupuesto y agenda la visita.',
        },
      ],
    },
    values: {
      title: 'Nuestros valores',
      body: 'Tres cosas que dan forma a cada sistema que entregamos, y el porqué de construirlos.',
      items: [
        { t: 'Tech', d: 'IA nativa, no un chatbot pegado encima. Cada sistema que entregamos aprende y mejora con datos propios.' },
        { t: 'Eco', d: 'Menos residuo, menos fricción. Ayudamos a mostrar y gestionar propiedades pensadas para pesar menos sobre el planeta.' },
        { t: 'Contemporáneo', d: 'Diseño y software de hoy, no una plantilla de hace cinco años.' },
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
