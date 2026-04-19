const { defineConfig } = require('cypress')
require('dotenv').config()

const port = process.env.PORT || 3000

module.exports = defineConfig({
  retries: {
    runMode: 2,
    openMode: 0
  },
  video: false,
  screenshotOnRunFailure: true,
  e2e: {
    baseUrl: `http://localhost:${port}`,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents (on, config) {
      // Set defaults, but CYPRESS_* env vars take precedence (already in config.env)
      // Default password must match cypress/setup.js
      config.env.admin_username = config.env.admin_username || process.env.ADMIN_USERNAME || 'admin@banmanagement.com'
      config.env.admin_password = config.env.admin_password || process.env.ADMIN_PASSWORD || 'xK9mQp2LvR7nS4jT'
      config.env.user_username = config.env.user_username || process.env.USER_USERNAME || 'user@banmanagement.com'
      config.env.user_password = config.env.user_password || process.env.USER_PASSWORD || 'testing'
      config.env.guest_username = config.env.guest_username || process.env.GUEST_USERNAME || 'guest@banmanagement.com'
      config.env.guest_password = config.env.guest_password || process.env.GUEST_PASSWORD || 'testing'
      config.env.session_name = config.env.session_name || process.env.SESSION_NAME || 'bm-webui-sess'
      return config
    }
  }
})
