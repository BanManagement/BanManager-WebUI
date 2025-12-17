const { defineConfig } = require('cypress')
require('dotenv').config()

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8001',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents (on, config) {
      config.env.admin_username = process.env.ADMIN_USERNAME || 'admin@banmanagement.com'
      config.env.admin_password = process.env.ADMIN_PASSWORD || 'testing'
      config.env.session_name = process.env.SESSION_NAME || 'bm-webui-sess'
      return config
    }
  }
})
