module.exports = async function playerWarning (obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerWarning.serverDataId.load({ server: server, id })

  return data
}
