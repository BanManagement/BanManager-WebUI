const assert = require('assert')
const fs = require('fs').promises
const os = require('os')
const path = require('path')
const {
  parseBanManagerConfig,
  buildTables,
  buildDatabaseConfig,
  buildConsoleUuid
} = require('../setup/parse-config')
const { tables: defaultTables } = require('../data/tables')

const sampleConfigYaml = `databases:
  local:
    type: mysql
    host: 127.0.0.1
    port: 3306
    user: bm_user
    password: hunter2
    name: bm_local
    tables:
      players: bm_custom_players
      playerBans: bm_custom_player_bans
`

const sampleConsoleYaml = `uuid: 11111111-2222-3333-8444-555555555555
name: Console
`

describe('setup/parse-config', () => {
  describe('buildTables', () => {
    test('returns defaults when no tables block', () => {
      assert.deepStrictEqual(buildTables({}), { ...defaultTables })
      assert.deepStrictEqual(buildTables(null), { ...defaultTables })
    })

    test('overlays known table keys from databases.local.tables', () => {
      const tables = buildTables({
        databases: {
          local: {
            tables: { players: 'bm_custom_players', unknownKey: 'should_be_ignored' }
          }
        }
      })

      assert.strictEqual(tables.players, 'bm_custom_players')
      assert.strictEqual(tables.unknownKey, undefined)
    })
  })

  describe('buildDatabaseConfig', () => {
    test('extracts a config block', () => {
      const config = buildDatabaseConfig({
        databases: { local: { host: 'h', port: 1234, user: 'u', password: 'p', name: 'n' } }
      })

      assert.deepStrictEqual(config, {
        host: 'h', port: 1234, user: 'u', password: 'p', database: 'n'
      })
    })

    test('returns null when host or database missing', () => {
      assert.strictEqual(buildDatabaseConfig({}), null)
      assert.strictEqual(buildDatabaseConfig({ databases: { local: { host: 'h' } } }), null)
    })
  })

  describe('buildConsoleUuid', () => {
    test('reads top-level uuid', () => {
      assert.strictEqual(buildConsoleUuid({ uuid: 'abc' }), 'abc')
    })

    test('reads nested console.uuid', () => {
      assert.strictEqual(buildConsoleUuid({ console: { uuid: 'def' } }), 'def')
    })

    test('returns null when missing', () => {
      assert.strictEqual(buildConsoleUuid({}), null)
      assert.strictEqual(buildConsoleUuid(null), null)
    })
  })

  describe('parseBanManagerConfig', () => {
    test('parses raw YAML strings via { configYaml, consoleYaml }', async () => {
      const result = await parseBanManagerConfig({
        configYaml: sampleConfigYaml,
        consoleYaml: sampleConsoleYaml
      })

      assert.strictEqual(result.databaseConfig.host, '127.0.0.1')
      assert.strictEqual(result.databaseConfig.database, 'bm_local')
      assert.strictEqual(result.tables.players, 'bm_custom_players')
      assert.strictEqual(result.tables.playerBans, 'bm_custom_player_bans')
      assert.strictEqual(result.consoleUuid, '11111111-2222-3333-8444-555555555555')
    })

    test('parses a directory containing config.yml + console.yml', async () => {
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'bm-parse-'))

      try {
        await fs.writeFile(path.join(dir, 'config.yml'), sampleConfigYaml)
        await fs.writeFile(path.join(dir, 'console.yml'), sampleConsoleYaml)

        const result = await parseBanManagerConfig(dir)

        assert.strictEqual(result.databaseConfig.host, '127.0.0.1')
        assert.strictEqual(result.consoleUuid, '11111111-2222-3333-8444-555555555555')
      } finally {
        await fs.rm(dir, { recursive: true, force: true })
      }
    })

    test('throws PARSE_BANMANAGER_CONFIG_NOT_FOUND for a missing path', async () => {
      const missing = path.join(os.tmpdir(), 'definitely-missing-' + Date.now())

      await assert.rejects(
        () => parseBanManagerConfig(missing),
        (err) => err.code === 'PARSE_BANMANAGER_CONFIG_NOT_FOUND'
      )
    })

    test('throws PARSE_BANMANAGER_CONFIG_INVALID_YAML for malformed YAML', async () => {
      await assert.rejects(
        () => parseBanManagerConfig({ configYaml: '\tthis: is\n\t not: yaml' }),
        (err) => err.code === 'PARSE_BANMANAGER_CONFIG_INVALID_YAML'
      )
    })

    test('returns defaults when source is null/undefined', async () => {
      const result = await parseBanManagerConfig(null)

      assert.deepStrictEqual(result.tables, { ...defaultTables })
      assert.strictEqual(result.consoleUuid, null)
      assert.strictEqual(result.databaseConfig, null)
    })
  })
})
