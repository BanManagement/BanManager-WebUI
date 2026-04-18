const assert = require('assert')
const {
  levenshtein,
  suggestVar,
  detectTyposForRequired,
  checkKeyFormat,
  checkSampleKeys,
  validateEnv,
  formatValidationError,
  SAMPLE_ENCRYPTION_KEY,
  SAMPLE_SESSION_KEY,
  NORMAL_REQUIRED
} = require('../setup/env-validator')

const validKey = 'a'.repeat(64)

const baseValidEnv = () => ({
  ENCRYPTION_KEY: validKey,
  SESSION_KEY: 'b'.repeat(64),
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  DB_USER: 'root',
  DB_NAME: 'bm_local',
  CONTACT_EMAIL: 'a@b.c',
  NOTIFICATION_VAPID_PUBLIC_KEY: 'pub',
  NOTIFICATION_VAPID_PRIVATE_KEY: 'priv'
})

describe('setup/env-validator', () => {
  describe('levenshtein', () => {
    test('returns 0 for identical strings', () => {
      assert.strictEqual(levenshtein('abc', 'abc'), 0)
    })

    test('treats casing as a free swap (lowercase compare)', () => {
      assert.strictEqual(levenshtein('ABC', 'abc'), 0)
    })

    test('counts edit distance for typos', () => {
      assert.strictEqual(levenshtein('DB_HSOT', 'DB_HOST'), 2)
      assert.strictEqual(levenshtein('', 'abc'), 3)
      assert.strictEqual(levenshtein('abc', ''), 3)
    })
  })

  describe('suggestVar', () => {
    test('suggests close known names', () => {
      assert.strictEqual(suggestVar('DB_HSOT'), 'DB_HOST')
      assert.strictEqual(suggestVar('SESION_KEY'), 'SESSION_KEY')
    })

    test('returns null for far-away strings', () => {
      assert.strictEqual(suggestVar('completely_different_thing'), null)
    })
  })

  describe('detectTyposForRequired', () => {
    test('flags provided env vars that look like a missing required var', () => {
      const env = { DB_HSOT: '127.0.0.1' }

      const matches = detectTyposForRequired(env, ['DB_HOST'])

      assert.strictEqual(matches.length, 1)
      assert.strictEqual(matches[0].provided, 'DB_HSOT')
      assert.strictEqual(matches[0].suggestion, 'DB_HOST')
    })

    test('does not flag exact matches or unrelated vars', () => {
      const env = { DB_HOST: '127.0.0.1', SOMETHING_ELSE: 'x' }

      const matches = detectTyposForRequired(env, ['DB_HOST'])

      assert.strictEqual(matches.length, 0)
    })
  })

  describe('checkKeyFormat', () => {
    test('reports invalid ENCRYPTION_KEY/SESSION_KEY format', () => {
      const issues = checkKeyFormat({
        ENCRYPTION_KEY: 'too-short',
        SESSION_KEY: 'z'.repeat(64)
      })

      const keys = issues.map(i => i.key)
      assert.deepStrictEqual(keys.sort(), ['ENCRYPTION_KEY', 'SESSION_KEY'])
    })

    test('returns no issues for valid keys', () => {
      const issues = checkKeyFormat({
        ENCRYPTION_KEY: validKey,
        SESSION_KEY: 'b'.repeat(64)
      })

      assert.deepStrictEqual(issues, [])
    })
  })

  describe('checkSampleKeys', () => {
    test('does nothing in non-production', async () => {
      const issues = await checkSampleKeys({
        env: { ENCRYPTION_KEY: SAMPLE_ENCRYPTION_KEY, SESSION_KEY: SAMPLE_SESSION_KEY },
        dbPool: null,
        isProduction: false
      })

      assert.deepStrictEqual(issues, [])
    })

    test('flags sample keys in production with no admin user', async () => {
      const issues = await checkSampleKeys({
        env: { ENCRYPTION_KEY: SAMPLE_ENCRYPTION_KEY, SESSION_KEY: SAMPLE_SESSION_KEY },
        dbPool: null,
        isProduction: true
      })

      const keys = issues.map(i => i.key).sort()
      assert.deepStrictEqual(keys, ['ENCRYPTION_KEY', 'SESSION_KEY'])
    })

    test('grandfathers sample keys in production when an admin already exists', async () => {
      const fakePool = (table) => ({
        select: () => ({ first: async () => ({ id: 1 }) })
      })
      fakePool.schema = { hasTable: async () => true }

      const issues = await checkSampleKeys({
        env: { ENCRYPTION_KEY: SAMPLE_ENCRYPTION_KEY, SESSION_KEY: SAMPLE_SESSION_KEY },
        dbPool: fakePool,
        isProduction: true
      })

      assert.deepStrictEqual(issues, [])
    })
  })

  describe('validateEnv', () => {
    test('passes for a complete valid env', async () => {
      const result = await validateEnv({ env: baseValidEnv() })

      assert.strictEqual(result.ok, true, formatValidationError(result))
      assert.deepStrictEqual(result.issues, [])
    })

    test('reports each missing required variable', async () => {
      const result = await validateEnv({ env: {}, required: NORMAL_REQUIRED })

      const keys = result.issues.map(i => i.key).sort()
      assert.deepStrictEqual(keys, [...NORMAL_REQUIRED].sort())
      assert.strictEqual(result.ok, false)
    })

    test('downgrades missing vars to warnings in setup mode', async () => {
      const result = await validateEnv({ env: {}, setupMode: true })

      assert.strictEqual(result.ok, true)
      assert.ok(result.warnings.length >= 1)
    })

    test('suggests typo when a near-match var is provided', async () => {
      const env = { ...baseValidEnv() }
      delete env.DB_HOST
      env.DB_HSOT = '127.0.0.1'

      const result = await validateEnv({ env })

      const dbHostIssue = result.issues.find(i => i.key === 'DB_HOST')
      assert.ok(dbHostIssue, 'expected an issue for DB_HOST')
      assert.match(dbHostIssue.message, /did you mean.*DB_HSOT/)
    })
  })

  describe('formatValidationError', () => {
    test('formats issues and warnings into a multi-line string', () => {
      const output = formatValidationError({
        issues: [{ key: 'A', message: 'A is bad' }],
        warnings: [{ key: 'B', message: 'B is meh' }]
      })

      assert.match(output, /Configuration errors:/)
      assert.match(output, /A is bad/)
      assert.match(output, /Configuration warnings:/)
      assert.match(output, /B is meh/)
    })
  })
})
