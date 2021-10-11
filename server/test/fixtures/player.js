const generateUUID = require('uuid/v4')
const { date, name, internet } = require('faker')
const { parse } = require('uuid-parse')
const { inetPton } = require('../../data/ip')

module.exports = function (overrides = {}) {
  return {
    id: parse(generateUUID(), Buffer.alloc(16)),
    name: name.firstName(),
    ip: inetPton(internet.ip()),
    lastSeen: Math.round((new Date(date.past()).getTime() / 1000)),
    ...overrides
  }
}
