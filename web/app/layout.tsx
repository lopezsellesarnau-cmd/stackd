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
  title: 'StackD — AI software studio',
  description:
    'We design and build AI software and automations that solve real business problems — shipped to production, not demoed.',
  robots: { index: false, follow: false },
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
