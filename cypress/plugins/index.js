require('dotenv').config()

module.exports = (_on, config) => {
  config.env.admin_username = process.env.ADMIN_USERNAME || 'admin@banmanagement.com'
  config.env.admin_password = process.env.ADMIN_PASSWORD || 'testing'
  config.env.session_name = process.env.SESSION_NAME || 'bm-webui-sess'

  return config
}
