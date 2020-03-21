const crypto = require('./crypto')

const generateServerId = async () => (await crypto.createKey(4)).toString('hex')

module.exports = { generateServerId }
