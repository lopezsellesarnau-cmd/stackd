import type { Metadata, Viewport } from 'next'
import { Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/language-context'

// Inter para titulares; IBM Plex Mono como lenguaje de etiquetado (estética
// "ficha técnica", igual que el /lab de Aithority — ver vault Sistema-UI).
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.stackd.codes'),
  title: 'StackD — AI systems for real estate agencies',
  description:
    'Instant lead response, virtual staging and video for every listing — generated in minutes, not days. Shipped to production, not demoed.',
  // Indexable desde el 24 jul 2026: el `noindex` era un resto de cuando la web
  // estaba en desarrollo y dejaba la agencia invisible en buscadores.
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: 'https://www.stackd.codes',
    siteName: 'StackD',
    title: 'StackD — AI systems for real estate agencies',
    description:
      'Instant lead response, virtual staging and video for every listing — generated in minutes, not days.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StackD — AI systems for real estate agencies',
    description:
      'Instant lead response, virtual staging and video for every listing — generated in minutes, not days.',
  },
}

export const viewport: Viewport = { themeColor: '#F0EEE9', colorScheme: 'light' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className={inter.className}>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[#111] focus:px-4 focus:py-2 focus:font-mono focus:text-[11px] focus:uppercase focus:tracking-[0.12em] focus:text-[#F0EEE9]"
        >
          Skip to content
        </a>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
