/* global window, document, fetch */
(() => {
  const SETUP = window.__SETUP__ || {}
  const DEFAULT_TABLES = SETUP.defaultTables || {}
  const BASE_PATH = SETUP.basePath || ''
  const UUID_REGEX = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i

  const apiUrl = (suffix) => BASE_PATH + suffix

  const STEPS = [
    { id: 'token', label: 'Token', visible: () => SETUP.requireToken && !state.tokenVerified },
    { id: 'database', label: 'Database', visible: () => true },
    { id: 'server', label: 'Server', visible: () => true },
    { id: 'admin', label: 'Admin', visible: () => true },
    { id: 'review', label: 'Review', visible: () => true }
  ]

  const state = {
    current: SETUP.requireToken ? 'token' : 'database',
    tokenVerified: false,
    token: '',
    completed: { token: false, database: false, server: false, admin: false, review: false },
    db: {
      host: '127.0.0.1',
      port: '3306',
      user: 'root',
      password: '',
      database: 'bm_webui',
      createIfMissing: false,
      adminUser: '',
      adminPassword: ''
    },
    server: {
      mode: 'manual',
      name: 'Survival',
      host: '127.0.0.1',
      port: '3306',
      user: 'root',
      password: '',
      database: 'bm',
      tables: { ...DEFAULT_TABLES },
      console: '',
      configYaml: '',
      consoleYaml: '',
      configPath: ''
    },
    admin: { email: '', password: '', confirmPassword: '', playerUuid: '' },
    serverContext: null
  }

  const root = document.getElementById('step-content')
  const progressEl = document.getElementById('progress')

  const visibleSteps = () => STEPS.filter((s) => s.visible())

  const escapeHtml = (str) =>
    String(str == null ? '' : str).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[ch])

  const renderProgress = () => {
    progressEl.innerHTML = ''
    for (const step of visibleSteps()) {
      const el = document.createElement('div')
      el.className = 'step'
      if (step.id === state.current) el.classList.add('active')
      else if (state.completed[step.id]) el.classList.add('done')
      el.textContent = step.label
      progressEl.appendChild(el)
    }
  }

  const clearErrors = () => {
    root.querySelectorAll('.banner.error').forEach((el) => el.remove())
  }

  const renderError = (message) => {
    clearErrors()
    const banner = document.createElement('div')
    banner.className = 'banner error'
    banner.textContent = message
    root.prepend(banner)
  }

  const post = async (path, body) => {
    const headers = { 'Content-Type': 'application/json' }
    if (state.token) headers['X-Setup-Token'] = state.token
    const res = await fetch(apiUrl(path), { method: 'POST', headers, body: JSON.stringify(body || {}) })
    let payload = null
    try { payload = await res.json() } catch (_) {}
    if (!res.ok) {
      const message = payload && payload.error ? payload.error : 'Request failed: ' + res.status
      const err = new Error(message)
      err.payload = payload
      err.status = res.status
      throw err
    }
    return payload || {}
  }

  const goto = (id) => { state.current = id; render() }

  const setBusy = (button, busyLabel) => {
    button.dataset.originalLabel = button.textContent
    button.disabled = true
    button.textContent = busyLabel
  }
  const clearBusy = (button) => {
    button.disabled = false
    if (button.dataset.originalLabel) button.textContent = button.dataset.originalLabel
  }

  const setHtml = (html) => { root.innerHTML = html }

  const buttonRow = (back, primary) => {
    const cls = back ? 'button-row split' : 'button-row'
    const backBtn = back ? `<button class="secondary" id="back">${escapeHtml(back)}</button>` : ''
    return `<div class="${cls}">${backBtn}<button id="next">${escapeHtml(primary)}</button></div>`
  }

  const fieldRow = (left, right) => `<div class="row"><div>${left}</div><div>${right}</div></div>`

  const stepToken = () => {
    setHtml(`
      <h2>Setup token required</h2>
      <p>This server requires a token to start setup. Look in the server logs for the value of <code>SETUP_TOKEN</code>.</p>
      <label for="token">Token</label>
      <input id="token" type="password" value="" autocomplete="off" />
      <div class="button-row"><button id="next">Continue</button></div>
    `)
    document.getElementById('next').addEventListener('click', async (e) => {
      const token = document.getElementById('token').value.trim()
      if (!token) return renderError('Token is required')
      state.token = token
      const button = e.currentTarget
      setBusy(button, 'Verifying...')
      try {
        const result = await post('/api/setup/token', { token })
        if (result.ok) {
          state.tokenVerified = true
          state.completed.token = true
          goto('database')
        } else {
          renderError('Token rejected')
          clearBusy(button)
        }
      } catch (err) {
        renderError(err.message)
        clearBusy(button)
      }
    })
  }

  const stepDatabase = () => {
    setHtml(`
      <h2>1. WebUI database</h2>
      <p>Where should the WebUI store its own data? You can reuse the BanManager database or use a separate one.</p>
      ${fieldRow(
        `<label for="db-host">Host</label><input id="db-host" type="text" value="${escapeHtml(state.db.host)}" />`,
        `<label for="db-port">Port</label><input id="db-port" type="number" value="${escapeHtml(state.db.port)}" />`
      )}
      ${fieldRow(
        `<label for="db-user">User</label><input id="db-user" type="text" value="${escapeHtml(state.db.user)}" />`,
        `<label for="db-password">Password</label><input id="db-password" type="password" value="${escapeHtml(state.db.password)}" />`
      )}
      <label for="db-name">Database name</label>
      <input id="db-name" type="text" value="${escapeHtml(state.db.database)}" />
      <details${state.db.createIfMissing ? ' open' : ''}>
        <summary>Database does not exist yet?</summary>
        <p>Tick the box below and (optionally) provide a privileged user; setup will run <code>CREATE DATABASE</code> for you.</p>
        <label class="inline">
          <input id="db-create" type="checkbox" ${state.db.createIfMissing ? 'checked' : ''} />
          Create database if missing
        </label>
        ${fieldRow(
          `<label for="db-admin-user">Privileged user (optional)</label><input id="db-admin-user" type="text" value="${escapeHtml(state.db.adminUser)}" />`,
          `<label for="db-admin-password">Privileged password (optional)</label><input id="db-admin-password" type="password" value="${escapeHtml(state.db.adminPassword)}" />`
        )}
        <small class="hint">If left blank, setup will use the credentials above.</small>
      </details>
      ${buttonRow(null, 'Test & continue')}
    `)
    document.getElementById('next').addEventListener('click', async (e) => {
      state.db.host = document.getElementById('db-host').value.trim()
      state.db.port = document.getElementById('db-port').value.trim()
      state.db.user = document.getElementById('db-user').value.trim()
      state.db.password = document.getElementById('db-password').value
      state.db.database = document.getElementById('db-name').value.trim()
      state.db.createIfMissing = document.getElementById('db-create').checked
      state.db.adminUser = document.getElementById('db-admin-user').value.trim()
      state.db.adminPassword = document.getElementById('db-admin-password').value
      const button = e.currentTarget
      setBusy(button, 'Testing...')
      try {
        await post('/api/setup/database', state.db)
        state.completed.database = true
        goto('server')
      } catch (err) {
        renderError(err.message)
        clearBusy(button)
      }
    })
  }

  const stepServer = () => {
    const tabsHtml = `
      <div class="tabs">
        <button data-mode="manual" class="${state.server.mode === 'manual' ? 'active' : ''}">Enter manually</button>
        <button data-mode="paste" class="${state.server.mode === 'paste' ? 'active' : ''}">Paste config.yml / console.yml</button>
        <button data-mode="path" class="${state.server.mode === 'path' ? 'active' : ''}">Path on filesystem</button>
      </div>
    `

    let bodyHtml
    if (state.server.mode === 'paste') {
      bodyHtml = `
        <label for="srv-config-yaml">Paste config.yml contents</label>
        <textarea id="srv-config-yaml" placeholder="databases:&#10;  local:&#10;    host: ...">${escapeHtml(state.server.configYaml)}</textarea>
        <label for="srv-console-yaml">Paste console.yml contents</label>
        <textarea id="srv-console-yaml" placeholder="uuid: 11111111-2222-...">${escapeHtml(state.server.consoleYaml)}</textarea>
        <label for="srv-name">Server display name</label>
        <input id="srv-name" type="text" value="${escapeHtml(state.server.name)}" />
      `
    } else if (state.server.mode === 'path') {
      bodyHtml = `
        <label for="srv-path">Path to BanManager plugin folder (or specific YAML file)</label>
        <input id="srv-path" type="text" value="${escapeHtml(state.server.configPath)}" placeholder="/srv/minecraft/plugins/BanManager" />
        <label for="srv-name">Server display name</label>
        <input id="srv-name" type="text" value="${escapeHtml(state.server.name)}" />
      `
    } else {
      const tableKeys = Object.keys(DEFAULT_TABLES)
      const hasOverrides = tableKeys.some((k) => state.server.tables[k] && state.server.tables[k] !== DEFAULT_TABLES[k])
      const tableInputs = tableKeys.map((key) => {
        const value = state.server.tables[key] != null ? state.server.tables[key] : DEFAULT_TABLES[key]
        return `
          <div>
            <label for="srv-table-${escapeHtml(key)}">${escapeHtml(key)}</label>
            <input id="srv-table-${escapeHtml(key)}" data-table-key="${escapeHtml(key)}" type="text" value="${escapeHtml(value)}" />
          </div>
        `
      }).join('')

      bodyHtml = `
        <label for="srv-name">Server display name</label>
        <input id="srv-name" type="text" value="${escapeHtml(state.server.name)}" />
        ${fieldRow(
          `<label for="srv-host">Host</label><input id="srv-host" type="text" value="${escapeHtml(state.server.host)}" />`,
          `<label for="srv-port">Port</label><input id="srv-port" type="number" value="${escapeHtml(state.server.port)}" />`
        )}
        ${fieldRow(
          `<label for="srv-user">User</label><input id="srv-user" type="text" value="${escapeHtml(state.server.user)}" />`,
          `<label for="srv-password">Password</label><input id="srv-password" type="password" value="${escapeHtml(state.server.password)}" />`
        )}
        <label for="srv-database">Database name</label>
        <input id="srv-database" type="text" value="${escapeHtml(state.server.database)}" />
        <label for="srv-console">Console UUID (paste "uuid" from BanManager/console.yml)</label>
        <input id="srv-console" type="text" value="${escapeHtml(state.server.console)}" placeholder="11111111-2222-3333-4444-555555555555" required />
        <details${hasOverrides ? ' open' : ''}>
          <summary>Advanced: Customise table names</summary>
          <p><small class="hint">Only change these if your BanManager <code>config.yml</code> uses non-default table names.</small></p>
          <div class="table-grid">${tableInputs}</div>
          <div class="button-row"><button type="button" class="secondary" id="reset-tables">Reset to defaults</button></div>
        </details>
      `
    }

    setHtml(`
      <h2>2. BanManager server</h2>
      <p>Connection details for the Minecraft database that the BanManager plugin writes to.</p>
      ${tabsHtml}
      ${bodyHtml}
      ${buttonRow('Back', 'Test & continue')}
    `)

    root.querySelectorAll('.tabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.server.mode = btn.dataset.mode
        render()
      })
    })
    document.getElementById('back').addEventListener('click', () => goto('database'))

    const resetBtn = document.getElementById('reset-tables')
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.server.tables = { ...DEFAULT_TABLES }
        render()
      })
    }
    root.querySelectorAll('input[data-table-key]').forEach((input) => {
      input.addEventListener('input', () => {
        const key = input.dataset.tableKey
        state.server.tables[key] = input.value.trim() || DEFAULT_TABLES[key]
      })
    })

    document.getElementById('next').addEventListener('click', async (e) => {
      const payload = { mode: state.server.mode, db: state.db }
      const nameInput = document.getElementById('srv-name')
      if (nameInput) state.server.name = nameInput.value.trim()
      payload.name = state.server.name

      if (state.server.mode === 'paste') {
        state.server.configYaml = document.getElementById('srv-config-yaml').value
        state.server.consoleYaml = document.getElementById('srv-console-yaml').value
        if (!state.server.configYaml.trim()) return renderError('Please paste the contents of config.yml')
        if (!state.server.consoleYaml.trim()) return renderError('Please paste the contents of console.yml so the Console UUID can be detected')
        payload.configYaml = state.server.configYaml
        payload.consoleYaml = state.server.consoleYaml
      } else if (state.server.mode === 'path') {
        state.server.configPath = document.getElementById('srv-path').value.trim()
        if (!state.server.configPath) return renderError('A filesystem path is required')
        payload.configPath = state.server.configPath
      } else {
        state.server.host = document.getElementById('srv-host').value.trim()
        state.server.port = document.getElementById('srv-port').value.trim()
        state.server.user = document.getElementById('srv-user').value.trim()
        state.server.password = document.getElementById('srv-password').value
        state.server.database = document.getElementById('srv-database').value.trim()
        state.server.console = document.getElementById('srv-console').value.trim()
        if (!state.server.host || !state.server.user || !state.server.database) {
          return renderError('Host, user and database are required')
        }
        if (!state.server.console) {
          return renderError('Console UUID is required. Paste the "uuid" value from BanManager/console.yml.')
        }
        if (!UUID_REGEX.test(state.server.console)) {
          return renderError('Console UUID is not a valid UUID format (expected something like 11111111-2222-3333-4444-555555555555).')
        }
        payload.connection = {
          host: state.server.host,
          port: state.server.port,
          user: state.server.user,
          password: state.server.password,
          database: state.server.database
        }
        payload.consoleUuid = state.server.console
        payload.tables = state.server.tables
      }
      const button = e.currentTarget
      setBusy(button, 'Testing...')
      try {
        const result = await post('/api/setup/server', payload)
        state.serverContext = result
        if (result.connection) Object.assign(state.server, result.connection)
        if (result.tables) state.server.tables = result.tables
        if (result.consoleUuid) state.server.console = result.consoleUuid
        if (result.name) state.server.name = result.name
        state.completed.server = true
        goto('admin')
      } catch (err) {
        renderError(err.message)
        clearBusy(button)
      }
    })
  }

  const stepAdmin = () => {
    setHtml(`
      <h2>3. Admin account</h2>
      <p>The first user. They will have full permissions. You can add more accounts later via <code>npx bmwebui account create</code>.</p>
      <label for="adm-email">Email address</label>
      <input id="adm-email" type="text" value="${escapeHtml(state.admin.email)}" />
      ${fieldRow(
        `<label for="adm-password">Password (min 6)</label><input id="adm-password" type="password" value="${escapeHtml(state.admin.password)}" />`,
        `<label for="adm-confirm">Confirm password</label><input id="adm-confirm" type="password" value="${escapeHtml(state.admin.confirmPassword)}" />`
      )}
      <label for="adm-uuid">Your Minecraft player UUID</label>
      <input id="adm-uuid" type="text" value="${escapeHtml(state.admin.playerUuid)}" placeholder="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" />
      <small class="hint">The player must have joined the Minecraft server at least once after BanManager was installed.</small>
      ${buttonRow('Back', 'Continue')}
    `)
    document.getElementById('back').addEventListener('click', () => goto('server'))
    document.getElementById('next').addEventListener('click', async (e) => {
      state.admin.email = document.getElementById('adm-email').value.trim()
      state.admin.password = document.getElementById('adm-password').value
      state.admin.confirmPassword = document.getElementById('adm-confirm').value
      state.admin.playerUuid = document.getElementById('adm-uuid').value.trim()
      if (state.admin.password !== state.admin.confirmPassword) return renderError('Passwords do not match')
      const button = e.currentTarget
      setBusy(button, 'Validating...')
      try {
        await post('/api/setup/admin/preflight', {
          email: state.admin.email,
          password: state.admin.password,
          playerUuid: state.admin.playerUuid
        })
        state.completed.admin = true
        goto('review')
      } catch (err) {
        renderError(err.message)
        clearBusy(button)
      }
    })
  }

  const stepReview = () => {
    const summary = {
      db: { host: state.db.host, port: state.db.port, user: state.db.user, database: state.db.database },
      server: {
        name: state.server.name,
        host: state.server.host,
        port: state.server.port,
        user: state.server.user,
        database: state.server.database
      },
      admin: { email: state.admin.email, playerUuid: state.admin.playerUuid }
    }

    setHtml(`
      <h2>4. Review and finalise</h2>
      <p>Setup will:</p>
      <ul>
        <li>Save the WebUI database connection details and any generated keys to <code>.env</code></li>
        <li>Apply database migrations</li>
        <li>Save the BanManager server</li>
        <li>Create your admin account</li>
        <li>Restart the WebUI in normal mode</li>
      </ul>
      <p><strong>Connection summary</strong></p>
      <pre>${escapeHtml(JSON.stringify(summary, null, 2))}</pre>
      <p>Need to add more BanManager servers later? Sign in and visit <strong>Admin &rarr; Servers &rarr; Add</strong>, or run <code>npx bmwebui setup</code> again.</p>
      ${buttonRow('Back', 'Finalise installation')}
    `)
    document.getElementById('back').addEventListener('click', () => goto('admin'))
    document.getElementById('next').addEventListener('click', async (e) => {
      const button = e.currentTarget
      setBusy(button, 'Finalising...')
      try {
        const result = await post('/api/setup/finalize', { db: state.db, server: state.server, admin: state.admin })
        state.completed.review = true
        renderFinished(result)
      } catch (err) {
        renderError(err.message)
        clearBusy(button)
      }
    })
  }

  const renderFinished = (result) => {
    progressEl.innerHTML = ''
    const restartCopy = result.restartedAutomatically
      ? 'The server will restart momentarily; reload this page in a few seconds.'
      : 'Restart the WebUI to switch out of setup mode &mdash; the CLI session that started it should pick up the new <code>.env</code> automatically.'
    setHtml(`
      <div class="success">
        <div class="check">&#10003;</div>
        <h2>Installation complete</h2>
        <p>Your WebUI is ready. ${restartCopy}</p>
      </div>
      <div class="button-row"><button id="reload">Continue to login</button></div>
    `)
    document.getElementById('reload').addEventListener('click', () => { window.location.href = (BASE_PATH || '') + '/login' })
  }

  const render = () => {
    renderProgress()
    switch (state.current) {
      case 'token': return stepToken()
      case 'database': return stepDatabase()
      case 'server': return stepServer()
      case 'admin': return stepAdmin()
      case 'review': return stepReview()
    }
  }

  render()
})()
