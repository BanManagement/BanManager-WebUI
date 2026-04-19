const fs = require('fs')
const path = require('path')

const { tables: defaultTables } = require('../data/tables')

const STATIC_DIR = path.join(__dirname, 'static')
const ICON_PATH = path.join(__dirname, '..', '..', 'public', 'images', 'banmanager-icon.png')

const safeRead = (filePath, encoding) => {
  try {
    return fs.readFileSync(filePath, encoding)
  } catch (e) {
    console.warn(`[installer] Could not load ${filePath}: ${e.message}`)
    return null
  }
}

const HTML_TEMPLATE = safeRead(path.join(STATIC_DIR, 'installer.html'), 'utf8')
const CSS = safeRead(path.join(STATIC_DIR, 'installer.css'), 'utf8')
const JS = safeRead(path.join(STATIC_DIR, 'installer.js'), 'utf8')
const ICON = safeRead(ICON_PATH)

const FALLBACK_HTML = '<!doctype html><html><head><meta charset="utf-8">' +
  '<title>BanManager WebUI Setup</title></head>' +
  '<body style="font-family:sans-serif;background:#121212;color:#e5e7eb;padding:2rem;line-height:1.5">' +
  '<h1>Setup assets are missing</h1>' +
  '<p>The installer static files could not be loaded. This usually means the WebUI was deployed without ' +
  'the <code>server/setup/static/</code> directory or the build step did not include it.</p>' +
  '<p>Please run <code>npx bmwebui setup</code> from a shell on this host instead, or re-deploy the WebUI ' +
  'with all bundled files intact.</p>' +
  '</body></html>'

const escapeHtml = (str) =>
  String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[ch])

const renderTemplate = (tpl, vars) =>
  tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars && vars[key] != null ? vars[key] : ''))

const escapeForScript = (json) =>
  json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')

// BASE_PATH is operator-controlled via env, but we still validate the format
// before splicing it into HTML attributes / JS strings. Anything that doesn't
// match a strict subpath (e.g. /admin or /admin/webui) is treated as empty
// to avoid breaking attributes or smuggling characters into the markup.
const BASE_PATH_REGEX = /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/

const sanitiseBasePath = (basePath) => {
  if (!basePath) return ''
  if (typeof basePath !== 'string') return ''
  if (!BASE_PATH_REGEX.test(basePath)) return ''
  return basePath
}

const buildHtml = ({ clientIp, isSecure, isLoopback, requireToken, version, basePath } = {}) => {
  if (!HTML_TEMPLATE) return FALLBACK_HTML

  const safeBasePath = sanitiseBasePath(basePath)

  const insecureBanner = (!isSecure && !isLoopback)
    ? '<div class="banner error"><strong>Your connection is not encrypted.</strong> Passwords entered here could be intercepted. Use HTTPS or run setup over localhost (an SSH tunnel works).</div>'
    : ''

  const setupConfig = escapeForScript(JSON.stringify({
    requireToken: Boolean(requireToken),
    isSecure: Boolean(isSecure),
    isLoopback: Boolean(isLoopback),
    clientIp: clientIp || '',
    basePath: safeBasePath,
    defaultTables
  }))

  return renderTemplate(HTML_TEMPLATE, {
    basePath: escapeHtml(safeBasePath),
    clientIp: escapeHtml(clientIp || 'unknown'),
    versionLabel: version ? 'v' + escapeHtml(version) : '',
    insecureBanner,
    setupConfig
  })
}

module.exports = {
  buildHtml,
  escapeHtml,
  hasAssets: () => Boolean(HTML_TEMPLATE && CSS && JS),
  getCss: () => CSS || '/* installer.css missing */',
  getJs: () => JS || '/* installer.js missing */',
  getIcon: () => ICON
}
