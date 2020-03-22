const { date, name, internet } = require('faker')
const { parse } = require('uuid-parse')
const generateUUID = require('uuid/v4')

module.exports = function () {
  return {
    id: parse(generateUUID(), Buffer.alloc(16)),
    name: name.firstName(),
    ip: internet.ip(),
    lastSeen: Math.round((new Date(date.past()).getTime() / 1000))
  }
}
