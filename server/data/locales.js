const SUPPORTED_LOCALES = ['en', 'de']
const DEFAULT_LOCALE = 'en'
const LOCALE_COOKIE = 'bm_locale'

const isSupportedLocale = (value) =>
  typeof value === 'string' && SUPPORTED_LOCALES.includes(value)

const parseCookieHeader = (cookieHeader, name) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return null

  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')

    if (eq === -1) continue

    const key = trimmed.slice(0, eq).trim()

    if (key !== name) continue

    return decodeURIComponent(trimmed.slice(eq + 1).trim())
  }

  return null
}

const parseAcceptLanguage = (header) => {
  if (!header || typeof header !== 'string') return []

  return header
    .split(',')
    .map((entry) => {
      const [tag, ...params] = entry.split(';').map((p) => p.trim())
      const qParam = params.find((p) => p.startsWith('q='))
      const q = qParam ? parseFloat(qParam.slice(2)) : 1.0

      return { tag, q: Number.isFinite(q) ? q : 1.0 }
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q)
    .map((entry) => entry.tag.toLowerCase())
}

const negotiateLocale = ({ user, cookieValue, acceptLanguage } = {}) => {
  if (user && isSupportedLocale(user.locale)) return user.locale
  if (isSupportedLocale(cookieValue)) return cookieValue

  const ranked = parseAcceptLanguage(acceptLanguage)

  for (const tag of ranked) {
    const primary = tag.split('-')[0]

    if (isSupportedLocale(primary)) return primary
  }

  return DEFAULT_LOCALE
}

const negotiateLocaleFromRequest = (req, user) => {
  const cookieHeader = req && req.headers && req.headers.cookie ? req.headers.cookie : ''
  const acceptLanguage = req && req.headers && req.headers['accept-language'] ? req.headers['accept-language'] : ''

  return negotiateLocale({
    user,
    cookieValue: parseCookieHeader(cookieHeader, LOCALE_COOKIE),
    acceptLanguage
  })
}

module.exports = {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseCookieHeader,
  parseAcceptLanguage,
  negotiateLocale,
  negotiateLocaleFromRequest
}
