const { isValidHexKey, HEX_KEY_LENGTH } = require('./keys')

const SAMPLE_ENCRYPTION_KEY = 'b097b390a68441cc3bb151dd0171f25c3aabc688c50eeb26dc5e13254b333911'
const SAMPLE_SESSION_KEY = 'a73545a5f08d2906e39a4438014200303f9269f3ade9227525ffb141294f1b62'

const NORMAL_REQUIRED = [
  'ENCRYPTION_KEY',
  'SESSION_KEY',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_NAME',
  'CONTACT_EMAIL',
  'NOTIFICATION_VAPID_PUBLIC_KEY',
  'NOTIFICATION_VAPID_PRIVATE_KEY'
]

const KNOWN_VARS = new Set([
  ...NORMAL_REQUIRED,
  'DB_PASSWORD',
  'DB_CONNECTION_LIMIT',
  'SERVER_FOOTER_NAME',
  'PORT',
  'HOSTNAME',
  'NODE_ENV',
  'BASE_PATH',
  'LOG_LEVEL',
  'SESSION_NAME',
  'UPLOAD_MAX_SIZE',
  'UPLOAD_PATH',
  'UPLOAD_MAX_DIMENSION',
  'DOCUMENT_CLEANUP_AGE_HOURS',
  'DISABLE_UI',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
  'SETUP_TOKEN',
  'DOTENV_CONFIG_PATH'
])

const levenshtein = (a, b) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const matrix = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1).fill(0))

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }

  return matrix[b.length][a.length]
}

const suggestVar = (input, candidates = KNOWN_VARS) => {
  let best = null
  let bestDistance = Infinity

  for (const candidate of candidates) {
    const distance = levenshtein(input, candidate)
    if (distance < bestDistance && distance <= Math.max(2, Math.floor(candidate.length / 4))) {
      bestDistance = distance
      best = candidate
    }
  }

  return best
}

const detectTyposForRequired = (env, required) => {
  const present = new Set(Object.keys(env))
  const suggestions = []

  for (const variable of required) {
    if (env[variable] != null && env[variable] !== '') continue

    for (const provided of present) {
      if (KNOWN_VARS.has(provided)) continue
      const distance = levenshtein(provided, variable)
      if (distance > 0 && distance <= 3) {
        suggestions.push({ provided, suggestion: variable, distance })
      }
    }
  }

  return suggestions.sort((a, b) => a.distance - b.distance)
}

const checkKeyFormat = (env) => {
  const issues = []

  if (env.ENCRYPTION_KEY && !isValidHexKey(env.ENCRYPTION_KEY)) {
    issues.push({
      key: 'ENCRYPTION_KEY',
      message: `ENCRYPTION_KEY must be a ${HEX_KEY_LENGTH}-character hex string. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    })
  }

  if (env.SESSION_KEY && !isValidHexKey(env.SESSION_KEY)) {
    issues.push({
      key: 'SESSION_KEY',
      message: `SESSION_KEY must be a ${HEX_KEY_LENGTH}-character hex string. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    })
  }

  return issues
}

const checkSampleKeys = async ({ env, dbPool, isProduction }) => {
  const issues = []

  if (!isProduction) return issues

  const usingSampleEncryption = env.ENCRYPTION_KEY === SAMPLE_ENCRYPTION_KEY
  const usingSampleSession = env.SESSION_KEY === SAMPLE_SESSION_KEY

  if (!usingSampleEncryption && !usingSampleSession) return issues

  let hasExistingAdmin = false

  if (dbPool) {
    try {
      const hasUsers = await dbPool.schema.hasTable('bm_web_users')
      if (hasUsers) {
        const row = await dbPool('bm_web_users').select('player_id').first()
        hasExistingAdmin = Boolean(row)
      }
    } catch (_) {
      hasExistingAdmin = false
    }
  }

  if (hasExistingAdmin) return issues

  if (usingSampleEncryption) {
    issues.push({
      key: 'ENCRYPTION_KEY',
      message: 'ENCRYPTION_KEY matches the sample value from .env.example. Generate a unique key before continuing in production.'
    })
  }

  if (usingSampleSession) {
    issues.push({
      key: 'SESSION_KEY',
      message: 'SESSION_KEY matches the sample value from .env.example. Generate a unique key before continuing in production.'
    })
  }

  return issues
}

const validateEnv = async ({
  env = process.env,
  setupMode = false,
  dbPool = null,
  required = NORMAL_REQUIRED
} = {}) => {
  const issues = []
  const warnings = []
  const isProduction = env.NODE_ENV === 'production'

  for (const variable of required) {
    if (env[variable] == null || env[variable] === '') {
      const issue = {
        key: variable,
        message: `Missing required environment variable: ${variable}`
      }

      const typoMatches = detectTyposForRequired({ ...env }, [variable])
      if (typoMatches.length) {
        issue.message += ` (did you mean to set this from ${typoMatches.map((t) => t.provided).join(', ')}?)`
      }

      if (setupMode) warnings.push(issue)
      else issues.push(issue)
    }
  }

  for (const formatIssue of checkKeyFormat(env)) {
    if (setupMode) warnings.push(formatIssue)
    else issues.push(formatIssue)
  }

  if (!setupMode) {
    const sampleIssues = await checkSampleKeys({ env, dbPool, isProduction })
    issues.push(...sampleIssues)
  }

  return { ok: issues.length === 0, issues, warnings }
}

const formatValidationError = ({ issues = [], warnings = [] }) => {
  const lines = []

  if (issues.length) {
    lines.push('Configuration errors:')
    for (const issue of issues) lines.push(`  - ${issue.message}`)
  }

  if (warnings.length) {
    lines.push('Configuration warnings:')
    for (const warning of warnings) lines.push(`  - ${warning.message}`)
  }

  return lines.join('\n')
}

module.exports = {
  NORMAL_REQUIRED,
  KNOWN_VARS,
  SAMPLE_ENCRYPTION_KEY,
  SAMPLE_SESSION_KEY,
  levenshtein,
  suggestVar,
  detectTyposForRequired,
  checkKeyFormat,
  checkSampleKeys,
  validateEnv,
  formatValidationError
}
