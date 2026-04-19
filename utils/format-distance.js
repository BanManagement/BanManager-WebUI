import { useEffect, useState } from 'react'
import { useLocale } from 'next-intl'
import { DEFAULT_LOCALE, LOCALE_CONFIG } from './locale'

const formatDistanceLocaleTokens = {
  lessThanXSeconds: '{{count}}s',
  xSeconds: '{{count}}s',
  halfAMinute: '30s',
  lessThanXMinutes: '{{count}}m',
  xMinutes: '{{count}}m',
  aboutXHours: '{{count}}h',
  xHours: '{{count}}h',
  xDays: '{{count}}d',
  aboutXWeeks: '{{count}}w',
  xWeeks: '{{count}}w',
  aboutXMonths: '{{count}}m',
  xMonths: '{{count}}m',
  aboutXYears: '{{count}}y',
  xYears: '{{count}}y',
  overXYears: '{{count}}y',
  almostXYears: '{{count}}y'
}

export const formatDistanceLocale = (
  token,
  count
) => {
  const result = formatDistanceLocaleTokens[token].replace(
    '{{count}}',
    count
  )

  return result
}

// Loaders keyed by the date-fns locale tag (matches LOCALE_CONFIG[*].dateFnsLocale).
// Adding a new UI locale requires a new entry here AND in LOCALE_CONFIG.
const dateFnsLocaleLoaders = {
  'en-GB': () => import('date-fns/locale/en-GB').then((m) => m.enGB),
  de: () => import('date-fns/locale/de').then((m) => m.de)
}

// Cache promises (not resolved values) so concurrent first-paint hooks share a single chunk request.
const localePromiseCache = new Map()
const localeValueCache = new Map()

const resolveDateFnsTag = (uiLocale) => {
  const config = LOCALE_CONFIG[uiLocale] || LOCALE_CONFIG[DEFAULT_LOCALE]
  return config.dateFnsLocale
}

export const loadDateFnsLocale = (uiLocale) => {
  const tag = resolveDateFnsTag(uiLocale)

  if (localePromiseCache.has(tag)) return localePromiseCache.get(tag)

  const loader = dateFnsLocaleLoaders[tag] || dateFnsLocaleLoaders[resolveDateFnsTag(DEFAULT_LOCALE)]
  const promise = loader().then((loaded) => {
    localeValueCache.set(tag, loaded)
    return loaded
  })

  localePromiseCache.set(tag, promise)

  return promise
}

// Eagerly warm the default locale so first paint has it available without a re-render.
if (typeof window !== 'undefined') {
  loadDateFnsLocale(DEFAULT_LOCALE).catch(() => { /* swallow — falls back at use site */ })
}

export const useDateFnsLocale = () => {
  const locale = useLocale()
  const tag = resolveDateFnsTag(locale)
  const [dateFnsLocale, setDateFnsLocale] = useState(() => localeValueCache.get(tag) || null)

  useEffect(() => {
    let cancelled = false
    const cached = localeValueCache.get(tag)

    if (cached) {
      setDateFnsLocale(cached)
      return
    }

    loadDateFnsLocale(locale).then((loaded) => {
      if (!cancelled) setDateFnsLocale(loaded)
    })

    return () => {
      cancelled = true
    }
  }, [locale, tag])

  return dateFnsLocale
}
