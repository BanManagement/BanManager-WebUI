// Based on https://github.com/kvz/locutus/blob/master/test/languages/php/network/test-inet_ntop.js
function inet_top(a) {
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

module.exports = { inet_top }
