module.exports = async function (ctx) {
  // Work around not being able to use autoCommit
  const manuallyCommit = ctx.session.manuallyCommit.bind(ctx.session)
  ctx.session = null // Deletes the cookie/session

  await manuallyCommit()

  ctx.response.body = null
}
