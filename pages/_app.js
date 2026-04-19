import Head from 'next/head'
import { DefaultSeo } from 'next-seo'
import { NextIntlClientProvider } from 'next-intl'
import { useEffect, useState } from 'react'

import '../styles/index.css'
import enMessages from '../messages/en.json'
import { DEFAULT_LOCALE, LOCALE_CONFIG, useResolvedLocale } from '../utils/locale'

const PRELOADED_MESSAGES = { en: enMessages }
const isDev = process.env.NODE_ENV !== 'production'

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const mergeFallback = (fallback, override) => {
  if (!isPlainObject(fallback)) return override
  if (!isPlainObject(override)) return override !== undefined ? override : fallback

  const result = { ...fallback }

  for (const key of Object.keys(override)) {
    result[key] = mergeFallback(fallback[key], override[key])
  }

  return result
}

const lookupFallback = (key) => {
  const segments = key.split('.')
  let cursor = enMessages

  for (const segment of segments) {
    if (cursor == null || typeof cursor !== 'object') return null

    cursor = cursor[segment]
  }

  return typeof cursor === 'string' ? cursor : null
}

const intlOnError = (error) => {
  if (error?.code === 'MISSING_MESSAGE') {
    if (isDev) console.warn(`[i18n] Missing translation, falling back to en: ${error.message}`)

    return
  }

  if (isDev) console.error(error)
}

const intlGetMessageFallback = ({ key, namespace }) => {
  const fullKey = namespace ? `${namespace}.${key}` : key
  const enValue = lookupFallback(fullKey)

  if (enValue) return enValue

  return isDev ? `[${fullKey}]` : ''
}

function MyApp ({ Component, pageProps }) {
  const { locale } = useResolvedLocale()
  const [messages, setMessages] = useState(enMessages)
  const [activeLocale, setActiveLocale] = useState(DEFAULT_LOCALE)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error('Service worker registration failed', error)
        })
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const apply = async () => {
      if (locale === activeLocale) return

      if (PRELOADED_MESSAGES[locale]) {
        setMessages(mergeFallback(enMessages, PRELOADED_MESSAGES[locale]))
        setActiveLocale(locale)
        return
      }

      try {
        const mod = await import(`../messages/${locale}.json`)

        if (cancelled) return

        PRELOADED_MESSAGES[locale] = mod.default || mod
        setMessages(mergeFallback(enMessages, PRELOADED_MESSAGES[locale]))
        setActiveLocale(locale)
      } catch (err) {
        console.error(`Failed to load messages for locale "${locale}"`, err)
      }
    }

    apply()

    return () => {
      cancelled = true
    }
  }, [locale, activeLocale])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const htmlLang = LOCALE_CONFIG[activeLocale]?.htmlLang || LOCALE_CONFIG[DEFAULT_LOCALE].htmlLang

    if (document.documentElement.lang !== htmlLang) {
      document.documentElement.lang = htmlLang
    }
  }, [activeLocale])

  const ogLocale = LOCALE_CONFIG[activeLocale]?.openGraphLocale || LOCALE_CONFIG[DEFAULT_LOCALE].openGraphLocale

  return (
    <NextIntlClientProvider
      locale={activeLocale}
      messages={messages}
      onError={intlOnError}
      getMessageFallback={intlGetMessageFallback}
    >
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <DefaultSeo
        openGraph={{
          type: 'website',
          locale: ogLocale,
          url: pageProps.origin,
          site_name: 'Ban Management'
        }}
      />
      <Component {...pageProps} />
    </NextIntlClientProvider>
  )
}

export default MyApp
