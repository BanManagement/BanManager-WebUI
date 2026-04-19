import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useUser } from './index'
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseCookieHeader,
  negotiateLocale,
  negotiateLocaleFromRequest
} from '../server/data/locales'
import { translateRestError, translateGraphqlError } from '../server/data/error-translation'

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  negotiateLocale,
  negotiateLocaleFromRequest,
  translateRestError,
  translateGraphqlError
}

export const LOCALE_CONFIG = {
  en: {
    label: 'English',
    htmlLang: 'en',
    openGraphLocale: 'en_GB',
    dateFormat: 'dd/MM/yyyy',
    dateFnsLocale: 'en-GB'
  },
  de: {
    label: 'Deutsch',
    htmlLang: 'de',
    openGraphLocale: 'de_DE',
    dateFormat: 'dd.MM.yyyy',
    dateFnsLocale: 'de'
  }
}

const readClientCookie = (name) => {
  if (typeof document === 'undefined') return null

  return parseCookieHeader(document.cookie || '', name)
}

const negotiateFromNavigator = () => {
  if (typeof navigator === 'undefined') return null

  const langs = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language]

  for (const lang of langs.filter(Boolean)) {
    const primary = lang.toLowerCase().split('-')[0]

    if (isSupportedLocale(primary)) return primary
  }

  return null
}

export const getCookiePath = () => {
  const basePath = process.env.BASE_PATH || ''

  return basePath || '/'
}

export const writeLocaleCookie = (locale) => {
  if (typeof document === 'undefined' || !isSupportedLocale(locale)) return

  const path = getCookiePath()
  const maxAge = 60 * 60 * 24 * 365

  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)}; Path=${path}; Max-Age=${maxAge}; SameSite=Lax`
}

const LocaleContext = createContext({
  locale: DEFAULT_LOCALE,
  ready: false,
  setLocale: () => {}
})

export const LocaleProvider = ({ children }) => {
  const { user } = useUser()
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE)
  const [ready, setReady] = useState(false)
  const [explicit, setExplicit] = useState(false)
  const previousUserId = useRef(null)

  useEffect(() => {
    if (previousUserId.current !== null && previousUserId.current !== (user?.id ?? null)) {
      setExplicit(false)
    }

    previousUserId.current = user?.id ?? null
  }, [user?.id])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isSupportedLocale(user?.locale) && !explicit) {
      setLocaleState(user.locale)
      setReady(true)

      return
    }

    if (explicit) {
      setReady(true)

      return
    }

    const cookieLocale = readClientCookie(LOCALE_COOKIE)

    if (isSupportedLocale(cookieLocale)) {
      setLocaleState(cookieLocale)
    } else {
      const navLocale = negotiateFromNavigator()

      if (navLocale) setLocaleState(navLocale)
    }

    setReady(true)
  }, [user?.locale, explicit])

  const setLocale = useCallback((next) => {
    if (!isSupportedLocale(next)) return

    writeLocaleCookie(next)
    setExplicit(true)
    setLocaleState(next)
  }, [])

  const value = useMemo(() => ({ locale, ready, setLocale }), [locale, ready, setLocale])

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useResolvedLocale = () => useContext(LocaleContext)
