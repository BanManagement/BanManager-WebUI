module.exports = function (ctx) {
  ctx.session = null // Deletes the cookie/session
  ctx.response.body = null
}
