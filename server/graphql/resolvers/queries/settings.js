module.exports = async function settings () {
  return {
    serverFooterName: process.env.SERVER_FOOTER_NAME || 'Powered by BanManager'
  }
}
