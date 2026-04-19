const assert = require('assert')
const { translateRestError, translateGraphqlError } = require('../data/error-translation')

const buildT = (catalog) => {
  const fn = (key, vars = {}) => {
    const template = catalog[key]
    if (template === undefined) return key
    return template.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? String(vars[name]) : `{${name}}`))
  }

  fn.has = (key) => Object.prototype.hasOwnProperty.call(catalog, key)
  return fn
}

describe('translateRestError', () => {
  test('returns null for missing response data', () => {
    const t = buildT({})
    assert.strictEqual(translateRestError(t, null), null)
    assert.strictEqual(translateRestError(t, undefined), null)
  })

  test('returns translated error when code matches catalog', () => {
    const t = buildT({ 'errors.PASSWORD_BREACHED': 'Password breached {count} times' })
    const err = translateRestError(t, { code: 'PASSWORD_BREACHED', meta: { count: 42 } })

    assert.ok(err instanceof Error)
    assert.strictEqual(err.message, 'Password breached 42 times')
    assert.strictEqual(err.code, 'PASSWORD_BREACHED')
    assert.deepStrictEqual(err.meta, { count: 42 })
  })

  test('falls back to server-supplied error when code is not in catalog', () => {
    const t = buildT({})
    const err = translateRestError(t, { code: 'WHATEVER', error: 'Something went wrong' })

    assert.strictEqual(err.message, 'Something went wrong')
    assert.strictEqual(err.code, 'WHATEVER')
    assert.deepStrictEqual(err.meta, {})
  })

  test('falls back to "Unknown error" when both code and error are missing', () => {
    const t = buildT({})
    const err = translateRestError(t, {})

    assert.strictEqual(err.message, 'Unknown error')
  })

  test('does not crash when meta is omitted', () => {
    const t = buildT({ 'errors.X': 'X happened' })
    const err = translateRestError(t, { code: 'X' })

    assert.strictEqual(err.message, 'X happened')
    assert.deepStrictEqual(err.meta, {})
  })
})

describe('translateGraphqlError', () => {
  test('returns input unchanged when source is falsy', () => {
    const t = buildT({})
    assert.strictEqual(translateGraphqlError(t, null), null)
    assert.strictEqual(translateGraphqlError(t, undefined), undefined)
  })

  test('translates ExposedError with appCode + meta', () => {
    const t = buildT({ 'errors.SERVER_NOT_FOUND': 'Server "{name}" not found' })
    const result = translateGraphqlError(t, {
      message: 'Server not found',
      extensions: { code: 'ERR_EXPOSED', appCode: 'SERVER_NOT_FOUND', meta: { name: 'Hub' } }
    })

    assert.strictEqual(result, 'Server "Hub" not found')
  })

  test('falls back to source.message when appCode has no translation', () => {
    const t = buildT({})
    const result = translateGraphqlError(t, {
      message: 'Original server message',
      extensions: { code: 'ERR_EXPOSED', appCode: 'UNMAPPED_CODE' }
    })

    assert.strictEqual(result, 'Original server message')
  })

  test('does NOT translate INTERNAL_SERVER_ERROR (returns source.message)', () => {
    const t = buildT({ 'errors.INTERNAL_SERVER_ERROR': 'Should not be used' })
    const result = translateGraphqlError(t, {
      message: 'Internal Server Error',
      extensions: { code: 'INTERNAL_SERVER_ERROR' }
    })

    assert.strictEqual(result, 'Internal Server Error')
  })

  test('does NOT translate INTERNAL appCode (returns source.message)', () => {
    const t = buildT({ 'errors.INTERNAL': 'Should not be used' })
    const result = translateGraphqlError(t, {
      message: 'Internal Server Error',
      extensions: { code: 'INTERNAL_SERVER_ERROR', appCode: 'INTERNAL' }
    })

    assert.strictEqual(result, 'Internal Server Error')
  })

  test('does NOT translate BAD_USER_INPUT (returns source.message verbatim)', () => {
    const t = buildT({ 'errors.BAD_USER_INPUT': 'should not be used' })
    const result = translateGraphqlError(t, {
      message: 'Must be at most 20 characters',
      extensions: { code: 'BAD_USER_INPUT' }
    })

    assert.strictEqual(result, 'Must be at most 20 characters')
  })

  test('does NOT translate UNKNOWN appCode (returns source.message)', () => {
    const t = buildT({ 'errors.UNKNOWN': 'Should not be used' })
    const result = translateGraphqlError(t, {
      message: 'A server error',
      extensions: { code: 'ERR_EXPOSED', appCode: 'UNKNOWN' }
    })

    assert.strictEqual(result, 'A server error')
  })

  test('uses transportCode as appCode fallback when transport is not ERR_EXPOSED', () => {
    const t = buildT({ 'errors.GRAPHQL_VALIDATION_FAILED': 'Validation failed' })
    const result = translateGraphqlError(t, {
      message: 'fallback msg',
      extensions: { code: 'GRAPHQL_VALIDATION_FAILED' }
    })

    assert.strictEqual(result, 'Validation failed')
  })

  test('uses extensions.meta over root meta', () => {
    const t = buildT({ 'errors.X': 'X={value}' })
    const result = translateGraphqlError(t, {
      message: 'fallback',
      meta: { value: 'root' },
      extensions: { code: 'ERR_EXPOSED', appCode: 'X', meta: { value: 'extensions' } }
    })

    assert.strictEqual(result, 'X=extensions')
  })

  test('falls back to root meta when extensions.meta is absent', () => {
    const t = buildT({ 'errors.X': 'X={value}' })
    const result = translateGraphqlError(t, {
      message: 'fallback',
      meta: { value: 'root' },
      extensions: { code: 'ERR_EXPOSED', appCode: 'X' }
    })

    assert.strictEqual(result, 'X=root')
  })
})
