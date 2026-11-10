import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/language-context'

// Sans = Helvetica (globals.css); IBM Plex Mono para índices, etiquetas y stacks.
// Mismo estilo personal que arnau-lopez.com (vault Diseño/10-minimal-espacio-abierto), otra composición.
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.stackd.codes'),
  title: 'StackD | Software and AI studio by Arnau López',
  description:
    'StackD is the studio of Arnau López in Amsterdam. Web apps, mobile apps and AI features, designed, built and taken to production.',
  // Indexable desde el 24 jul 2026: el `noindex` era un resto de cuando la web
  // estaba en desarrollo y dejaba la agencia invisible en buscadores.
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://www.stackd.codes',
    siteName: 'StackD',
    title: 'StackD | Software and AI studio by Arnau López',
    description:
      'StackD is the studio of Arnau López in Amsterdam. Web apps, mobile apps and AI features, designed, built and taken to production.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StackD | Software and AI studio by Arnau López',
    description:
      'StackD is the studio of Arnau López in Amsterdam. Web apps, mobile apps and AI features, designed, built and taken to production.',
  },
}

export const viewport: Viewport = { themeColor: '#FFFFFF', colorScheme: 'light' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:text-paper"
        >
          Skip to content
        </a>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
