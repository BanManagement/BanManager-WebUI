const assert = require('assert')
const {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  parseCookieHeader,
  parseAcceptLanguage,
  negotiateLocale,
  negotiateLocaleFromRequest
} = require('../data/locales')

describe('Locale negotiation', () => {
  describe('isSupportedLocale', () => {
    test('returns true for supported locales', () => {
      for (const locale of SUPPORTED_LOCALES) {
        assert.strictEqual(isSupportedLocale(locale), true, `Expected ${locale} to be supported`)
      }
    })

    test('returns false for unsupported locales', () => {
      assert.strictEqual(isSupportedLocale('xx'), false)
      assert.strictEqual(isSupportedLocale('fr-FR'), false)
      assert.strictEqual(isSupportedLocale(''), false)
    })

    test('returns false for non-string values', () => {
      assert.strictEqual(isSupportedLocale(null), false)
      assert.strictEqual(isSupportedLocale(undefined), false)
      assert.strictEqual(isSupportedLocale(123), false)
      assert.strictEqual(isSupportedLocale({}), false)
    })
  })

  describe('SUPPORTED_LOCALES', () => {
    test('always includes en as default fallback', () => {
      assert.ok(SUPPORTED_LOCALES.includes('en'))
      assert.strictEqual(DEFAULT_LOCALE, 'en')
    })

    test('contains de translation locale', () => {
      assert.ok(SUPPORTED_LOCALES.includes('de'))
    })
  })

  describe('parseCookieHeader', () => {
    test('extracts the named cookie value', () => {
      const result = parseCookieHeader('foo=bar; bm_locale=de; baz=qux', LOCALE_COOKIE)

      assert.strictEqual(result, 'de')
    })

    test('returns null when cookie missing', () => {
      assert.strictEqual(parseCookieHeader('foo=bar', LOCALE_COOKIE), null)
    })

    test('returns null for empty/invalid input', () => {
      assert.strictEqual(parseCookieHeader('', LOCALE_COOKIE), null)
      assert.strictEqual(parseCookieHeader(null, LOCALE_COOKIE), null)
      assert.strictEqual(parseCookieHeader(undefined, LOCALE_COOKIE), null)
    })

    test('decodes URI-encoded values', () => {
      const result = parseCookieHeader('bm_locale=' + encodeURIComponent('de'), LOCALE_COOKIE)

      assert.strictEqual(result, 'de')
    })

    test('skips malformed cookie segments', () => {
      const result = parseCookieHeader('malformed; bm_locale=de', LOCALE_COOKIE)

      assert.strictEqual(result, 'de')
    })
  })

  describe('parseAcceptLanguage', () => {
    test('parses simple accept-language', () => {
      assert.deepStrictEqual(parseAcceptLanguage('en'), ['en'])
    })

    test('parses prioritised accept-language', () => {
      assert.deepStrictEqual(
        parseAcceptLanguage('de;q=0.8,en-GB;q=0.9,fr;q=0.7'),
        ['en-gb', 'de', 'fr']
      )
    })

    test('handles missing q (defaults to 1.0)', () => {
      assert.deepStrictEqual(
        parseAcceptLanguage('en-GB,de;q=0.5'),
        ['en-gb', 'de']
      )
    })

    test('returns empty array for invalid input', () => {
      assert.deepStrictEqual(parseAcceptLanguage(''), [])
      assert.deepStrictEqual(parseAcceptLanguage(null), [])
      assert.deepStrictEqual(parseAcceptLanguage(undefined), [])
    })
  })

  describe('negotiateLocale', () => {
    test('user preference wins over cookie and accept-language', () => {
      const result = negotiateLocale({
        user: { locale: 'de' },
        cookieValue: 'en',
        acceptLanguage: 'fr,en'
      })

      assert.strictEqual(result, 'de')
    })

    test('cookie wins over accept-language when no user', () => {
      const result = negotiateLocale({
        cookieValue: 'de',
        acceptLanguage: 'en'
      })

      assert.strictEqual(result, 'de')
    })

    test('falls back to accept-language when no cookie', () => {
      const result = negotiateLocale({
        acceptLanguage: 'de-DE,en;q=0.8'
      })

      assert.strictEqual(result, 'de')
    })

    test('falls back to DEFAULT_LOCALE when nothing matches', () => {
      const result = negotiateLocale({
        acceptLanguage: 'fr,it'
      })

      assert.strictEqual(result, DEFAULT_LOCALE)
    })

    test('ignores unsupported user.locale', () => {
      const result = negotiateLocale({
        user: { locale: 'xx' },
        cookieValue: 'de'
      })

      assert.strictEqual(result, 'de')
    })

    test('ignores unsupported cookie value', () => {
      const result = negotiateLocale({
        cookieValue: 'xx',
        acceptLanguage: 'de'
      })

      assert.strictEqual(result, 'de')
    })

    test('returns DEFAULT_LOCALE when no inputs provided', () => {
      assert.strictEqual(negotiateLocale(), DEFAULT_LOCALE)
      assert.strictEqual(negotiateLocale({}), DEFAULT_LOCALE)
    })
  })

  describe('negotiateLocaleFromRequest', () => {
    test('extracts locale from request cookies + headers', () => {
      const req = {
        headers: {
          cookie: 'session=abc; bm_locale=de',
          'accept-language': 'fr,en'
        }
      }

      assert.strictEqual(negotiateLocaleFromRequest(req), 'de')
    })

    test('falls back to accept-language when no cookie', () => {
      const req = {
        headers: { 'accept-language': 'de-DE,en;q=0.8' }
      }

      assert.strictEqual(negotiateLocaleFromRequest(req), 'de')
    })

    test('falls back to DEFAULT_LOCALE on missing/empty req', () => {
      assert.strictEqual(negotiateLocaleFromRequest(null), DEFAULT_LOCALE)
      assert.strictEqual(negotiateLocaleFromRequest({}), DEFAULT_LOCALE)
      assert.strictEqual(negotiateLocaleFromRequest({ headers: {} }), DEFAULT_LOCALE)
    })

    test('user override takes precedence over cookie', () => {
      const req = {
        headers: {
          cookie: 'bm_locale=en',
          'accept-language': 'fr'
        }
      }

      assert.strictEqual(negotiateLocaleFromRequest(req, { locale: 'de' }), 'de')
    })
  })
})
