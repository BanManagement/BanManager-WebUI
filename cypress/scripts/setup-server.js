#!/usr/bin/env node
/* eslint-disable no-console */

// Boots the WebUI through server.js for the e2e-setup Cypress run, respawning
// the child after each clean exit so the suite can exercise the real boot-mode
// switch: setup-mode -> finalise -> normal-mode.
//
// Notes on the env this script forces:
// - Spawn from a sandbox cwd so `dotenv.config()` cannot pick up the
//   developer's real .env on the first (setup-mode) boot.
// - NODE_ENV=production keeps handleFinalize on its `inDocker && != 'test'`
//   branch, which is what triggers the process.exit(0) we rely on for the
//   supervisor restart.
// - DISABLE_UI=true: the second boot has no .next build to load.

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
  // The production default (10/60s) is easily exhausted by Cypress retries
  // resubmitting steps within the same minute, surfacing as flaky 429s.
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
