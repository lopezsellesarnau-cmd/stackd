'use client'

/**
 * Selector de idioma EN/ES. Por ahora las llamadas y el trabajo comercial
 * son en español, así que se añade español además del inglés original —
 * no se sustituye, se ofrece como opción (por defecto sigue en inglés).
 */

import { createContext, useContext, useEffect, useState } from 'react'

export type Lang = 'en' | 'es'

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'en',
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  useEffect(() => {
    const stored = window.localStorage.getItem('stackd-lang')
    if (stored === 'en' || stored === 'es') setLangState(stored)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    window.localStorage.setItem('stackd-lang', l)
  }

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
