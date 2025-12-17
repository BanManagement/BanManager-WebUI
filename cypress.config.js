const { defineConfig } = require('cypress')
require('dotenv').config()

const port = process.env.PORT || 3000

module.exports = defineConfig({
  e2e: {
    baseUrl: `http://localhost:${port}`,
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents (on, config) {
      // Set defaults, but CYPRESS_* env vars take precedence (already in config.env)
      config.env.admin_username = config.env.admin_username || process.env.ADMIN_USERNAME || 'admin@banmanagement.com'
      config.env.admin_password = config.env.admin_password || process.env.ADMIN_PASSWORD || 'testing'
      config.env.session_name = config.env.session_name || process.env.SESSION_NAME || 'bm-webui-sess'
      return config
    }
  }
})
