'use strict'

const NON_TRANSLATABLE_APP_CODES = new Set([
  'INTERNAL_SERVER_ERROR',
  'INTERNAL',
  'BAD_USER_INPUT',
  'UNKNOWN'
])

const translateRestError = (t, responseData) => {
  if (!responseData) return null

  const code = responseData.code
  const meta = responseData.meta || {}
  const translated = code && t.has(`errors.${code}`) ? t(`errors.${code}`, meta) : null
  const err = new Error(translated || responseData.error || 'Unknown error')

  err.code = code
  err.meta = meta

  return err
}

const translateGraphqlError = (t, source) => {
  if (!source) return source

  const transportCode = source.extensions?.code || source.code
  const appCode = source.extensions?.appCode || (transportCode === 'ERR_EXPOSED' ? null : transportCode)
  const meta = source.extensions?.meta || source.meta || {}

  if (appCode && !NON_TRANSLATABLE_APP_CODES.has(appCode)) {
    const translated = t.has(`errors.${appCode}`) ? t(`errors.${appCode}`, meta) : null

    if (translated) return translated
  }

  return source.message || source
}

module.exports = {
  NON_TRANSLATABLE_APP_CODES,
  translateRestError,
  translateGraphqlError
}
