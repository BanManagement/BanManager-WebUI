module.exports = async function playerMute (obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerMute.serverDataId.load({ server: server, id })

  return data
}
