import { createContext, useContext, useState } from 'react'
import type { Language, Translations } from './types'
import { zhTW } from './translations/zh-TW'
import { zhCN } from './translations/zh-CN'
import { en } from './translations/en'

const TRANSLATIONS: Record<Language, Translations> = {
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  en,
}

const STORAGE_KEY = 'gto-language'

/**
 * @param value - localStorage 讀出的字串
 * @returns 合法語系代碼，否則預設 zh-TW
 */
function normalizeLanguage(value: string | null): Language {
  if (value === 'zh-CN' || value === 'en' || value === 'zh-TW') return value
  return 'zh-TW'
}

interface LanguageContextValue {
  lang: Language
  setLang: (l: Language) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'zh-TW',
  setLang: () => {},
  t: zhTW,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() =>
    normalizeLanguage(
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null,
    ),
  )

  /**
   * @param l - 要切換的語言
   */
  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
