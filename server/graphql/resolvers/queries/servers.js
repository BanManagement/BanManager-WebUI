module.exports = function servers (obj, args, { state }) {
  return Array.from(state.serversPool.values()).map(server => server.config)
}
