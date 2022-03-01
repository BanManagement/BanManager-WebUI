const { encode, decode } = require('@leichtgewicht/ip-codec')

function inetTop (a) {
  return decode(a)
}

function inetPton (a) {
  return encode(a, Buffer.alloc)
}

module.exports = { inetTop, inetPton }
