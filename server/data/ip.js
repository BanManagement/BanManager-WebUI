// Based on https://github.com/kvz/locutus/blob/master/test/languages/php/network/test-inet_ntop.js
function inetTop (a) {
  var i = 0
  var m = ''
  var c = []

  a += ''
  if (a.length === 4) {
    // IPv4
    return [
      a.charCodeAt(0),
      a.charCodeAt(1),
      a.charCodeAt(2),
      a.charCodeAt(3)
    ].join('.')
  } else if (a.length === 16) {
    // IPv6
    for (i = 0; i < 16; i++) {
      c.push(((a.charCodeAt(i++) << 8) + a.charCodeAt(i)).toString(16))
    }
    return c.join(':')
      .replace(/((^|:)0(?=:|$))+:?/g, function (t) {
        m = (t.length > m.length) ? t : m
        return t
      })
      .replace(m || ' ', '::')
  } else {
    // Invalid length
    return null
  }
}

function inetPton (a) {
  var r
  var m
  var x
  var i
  var j
  var f = String.fromCharCode

  // IPv4
  m = a.match(/^(?:\d{1,3}(?:\.|$)){4}/)
  if (m) {
    m = m[0].split('.')
    m = f(m[0]) + f(m[1]) + f(m[2]) + f(m[3])
    // Return if 4 bytes, otherwise false.
    return m.length === 4 ? m : false
  }
  r = /^((?:[\da-f]{1,4}(?::|)){0,8})(::)?((?:[\da-f]{1,4}(?::|)){0,8})$/

  // IPv6
  m = a.match(r)
  if (m) {
    // Translate each hexadecimal value.
    for (j = 1; j < 4; j++) {
      // Indice 2 is :: and if no length, continue.
      if (j === 2 || m[j].length === 0) {
        continue
      }
      m[j] = m[j].split(':')
      for (i = 0; i < m[j].length; i++) {
        m[j][i] = parseInt(m[j][i], 16)
        // Would be NaN if it was blank, return false.
        if (isNaN(m[j][i])) {
          // Invalid IP.
          return false
        }
        m[j][i] = f(m[j][i] >> 8) + f(m[j][i] & 0xFF)
      }
      m[j] = m[j].join('')
    }
    x = m[1].length + m[3].length
    if (x === 16) {
      return m[1] + m[3]
    } else if (x < 16 && m[2].length > 0) {
      return m[1] + (new Array(16 - x + 1))
        .join('\x00') + m[3]
    }
  }

  // Invalid IP
  return null
}

module.exports = { inetTop, inetPton }
