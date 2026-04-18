#!/usr/bin/env node
/* eslint-disable no-console */

// Boots the WebUI through server.js for the e2e-setup Cypress run, restarting
// the child process whenever it exits cleanly so that the suite can exercise
// the real boot-mode switching: setup-mode -> finalise -> normal-mode.
//
// Required env:
//   SETUP_PORT=3001                  port the server should listen on
//   SETUP_DOTENV_PATH=/tmp/...env    where the installer should write .env
// Optional env:
//   SETUP_TOKEN=<hex>                pre-populates the token-required flow
//   HOSTNAME=127.0.0.1               bind address (default 127.0.0.1)
//   LOG_LEVEL=warn                   pino log level
//
// Notes:
// - We spawn server.js from a sandbox cwd so `dotenv.config()` cannot pick up
//   the developer's local .env on first boot.
// - The first boot has no DB / key vars set, so server.js will detect "needs
//   setup" and serve buildSetupModeApp.
// - We deliberately leave NODE_ENV=production so that handleFinalize hits the
//   `inDocker && NODE_ENV !== 'test'` branch and process.exit(0)s the child;
//   the supervisor below then respawns server.js, which now finds the freshly
//   written .env at SETUP_DOTENV_PATH and boots in normal mode.
// - DISABLE_UI=true keeps the second boot from trying to load Next.js (we have
//   no .next build in CI for this target).

const { spawn } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const dotenvTarget = process.env.SETUP_DOTENV_PATH || path.join(os.tmpdir(), 'bm-setup-test.env')
const port = process.env.SETUP_PORT || '3001'
const hostname = process.env.HOSTNAME || '127.0.0.1'

if (process.env.RESET_DOTENV !== 'false') {
  try {
    if (fs.existsSync(dotenvTarget)) fs.unlinkSync(dotenvTarget)
  } catch (e) {
    console.warn(`[setup-server] could not clear ${dotenvTarget}: ${e.message}`)
  }
}

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'bm-setup-srv-'))
console.log(`[setup-server] sandbox cwd: ${sandbox}`)
console.log(`[setup-server] dotenv target: ${dotenvTarget}`)

const childEnv = {
  ...process.env,
  DOTENV_CONFIG_PATH: dotenvTarget,
  PORT: port,
  HOSTNAME: hostname,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DISABLE_UI: process.env.DISABLE_UI || 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'warn',
  // The default in-memory rate limit (10/60s) is fine for real installs but
  // is easily exhausted by Cypress retrying multiple step submissions in the
  // same minute, leading to flaky 429s that look like the wizard hanging.
  SETUP_RATE_LIMIT_POINTS: process.env.SETUP_RATE_LIMIT_POINTS || '10000',
  SETUP_RATE_LIMIT_DURATION: process.env.SETUP_RATE_LIMIT_DURATION || '60'
}

delete childEnv.ENCRYPTION_KEY
delete childEnv.SESSION_KEY
delete childEnv.NOTIFICATION_VAPID_PUBLIC_KEY
delete childEnv.NOTIFICATION_VAPID_PRIVATE_KEY
delete childEnv.DB_HOST
delete childEnv.DB_PORT
delete childEnv.DB_USER
delete childEnv.DB_PASSWORD
delete childEnv.DB_NAME

let child = null
let stopping = false

const stop = (signal) => {
  stopping = true
  if (child) child.kill(signal || 'SIGTERM')
}

process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))

const start = () => {
  if (stopping) return
  child = spawn(process.execPath, [path.join(__dirname, '..', '..', 'server.js')], {
    cwd: sandbox,
    env: childEnv,
    stdio: 'inherit'
  })
  child.on('exit', (code, signal) => {
    child = null
    if (stopping) {
      process.exit(0)
    } else if (signal) {
      console.error(`[setup-server] child killed by signal ${signal}`)
      process.exit(1)
    } else if (code === 0) {
      console.log('[setup-server] child exited cleanly, restarting (post-finalize)')
      setTimeout(start, 500)
    } else {
      console.error(`[setup-server] child exited with code ${code}`)
      process.exit(code || 1)
    }
  })
}

start()
