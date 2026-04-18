const fs = require('fs').promises
const path = require('path')
const yaml = require('js-yaml')
const { tables: defaultTables } = require('../data/tables')

const safeLoad = (source) => {
  try {
    return yaml.load(source)
  } catch (error) {
    const err = new Error(`Failed to parse YAML: ${error.message}`)
    err.cause = error
    err.code = 'PARSE_BANMANAGER_CONFIG_INVALID_YAML'
    throw err
  }
}

const tryReadFile = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8')
  } catch (e) {
    if (e.code === 'ENOENT') return null
    throw e
  }
}

const buildTables = (parsedConfig) => {
  const tables = { ...defaultTables }

  if (!parsedConfig || typeof parsedConfig !== 'object') return tables

  const tableSection = parsedConfig.databases &&
    parsedConfig.databases.local &&
    parsedConfig.databases.local.tables

  if (tableSection && typeof tableSection === 'object') {
    for (const [key, value] of Object.entries(tableSection)) {
      if (Object.prototype.hasOwnProperty.call(tables, key) && typeof value === 'string' && value.length) {
        tables[key] = value
      }
    }
  }

  return tables
}

const buildDatabaseConfig = (parsedConfig) => {
  if (!parsedConfig || typeof parsedConfig !== 'object') return null

  const local = parsedConfig.databases && parsedConfig.databases.local
  if (!local || typeof local !== 'object') return null

  const host = local.host
  const database = local.name || local.database
  if (!host || !database) return null

  return {
    host,
    port: local.port ? Number(local.port) : 3306,
    user: local.user || '',
    password: local.password != null ? String(local.password) : '',
    database
  }
}

const buildConsoleUuid = (consoleConfig) => {
  if (!consoleConfig || typeof consoleConfig !== 'object') return null

  if (typeof consoleConfig.uuid === 'string' && consoleConfig.uuid.length) {
    return consoleConfig.uuid
  }

  if (consoleConfig.console && typeof consoleConfig.console.uuid === 'string') {
    return consoleConfig.console.uuid
  }

  return null
}

// File paths supplied by the (unauthenticated) installer must be limited to
// BanManager's own config files. Otherwise an attacker who reaches /setup
// before the operator could trigger arbitrary YAML reads via this helper and
// observe parser errors (which include file content snippets) or extract
// `databases.local` payloads from unrelated YAML.
const ALLOWED_FILENAMES = new Set(['config.yml', 'console.yml'])

const isAllowedFilePath = (filePath) => {
  const base = path.basename(filePath).toLowerCase()
  return ALLOWED_FILENAMES.has(base)
}

const parseBanManagerConfig = async (source) => {
  const result = { tables: { ...defaultTables }, consoleUuid: null, databaseConfig: null }

  if (!source) return result

  if (typeof source === 'object' && (source.configYaml != null || source.consoleYaml != null)) {
    if (source.configYaml) {
      const parsed = safeLoad(source.configYaml)
      result.tables = buildTables(parsed)
      result.databaseConfig = buildDatabaseConfig(parsed)
    }

    if (source.consoleYaml) {
      const parsed = safeLoad(source.consoleYaml)
      result.consoleUuid = buildConsoleUuid(parsed)
    }

    return result
  }

  if (typeof source !== 'string') {
    throw new Error('parseBanManagerConfig expects a string path or { configYaml, consoleYaml }')
  }

  const trimmed = source.trim()
  const looksLikeYaml = trimmed.includes('\n') || trimmed.includes(':')
  const isPathLike = !looksLikeYaml || /^[./~]/.test(trimmed)

  if (isPathLike) {
    let stat
    try {
      stat = await fs.stat(source)
    } catch (e) {
      if (e.code === 'ENOENT') {
        const err = new Error(`Path not found: ${source}`)
        err.code = 'PARSE_BANMANAGER_CONFIG_NOT_FOUND'
        throw err
      }
      throw e
    }

    if (stat.isDirectory()) {
      const configYaml = await tryReadFile(path.join(source, 'config.yml'))
      const consoleYaml = await tryReadFile(path.join(source, 'console.yml'))

      if (configYaml) {
        const parsed = safeLoad(configYaml)
        result.tables = buildTables(parsed)
        result.databaseConfig = buildDatabaseConfig(parsed)
      }

      if (consoleYaml) {
        const parsed = safeLoad(consoleYaml)
        result.consoleUuid = buildConsoleUuid(parsed)
      }

      return result
    }

    if (!isAllowedFilePath(source)) {
      const err = new Error('Only BanManager config.yml or console.yml files are accepted; point to the plugin folder instead.')
      err.code = 'PARSE_BANMANAGER_CONFIG_DISALLOWED_FILE'
      throw err
    }

    const fileContents = await fs.readFile(source, 'utf8')
    const parsed = safeLoad(fileContents)

    if (path.basename(source).toLowerCase() === 'console.yml') {
      result.consoleUuid = buildConsoleUuid(parsed)
    } else {
      result.tables = buildTables(parsed)
      result.databaseConfig = buildDatabaseConfig(parsed)
    }

    return result
  }

  const parsed = safeLoad(source)

  if (parsed && parsed.databases) {
    result.tables = buildTables(parsed)
    result.databaseConfig = buildDatabaseConfig(parsed)
  } else if (parsed && (parsed.uuid || parsed.console)) {
    result.consoleUuid = buildConsoleUuid(parsed)
  } else {
    result.tables = buildTables(parsed)
    result.databaseConfig = buildDatabaseConfig(parsed)
    result.consoleUuid = buildConsoleUuid(parsed)
  }

  return result
}

module.exports = {
  parseBanManagerConfig,
  buildTables,
  buildDatabaseConfig,
  buildConsoleUuid
}
