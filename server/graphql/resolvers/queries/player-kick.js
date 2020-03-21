module.exports = async function playerKick (obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerKick.serverDataId.load({ server: server, id })

  return data
}
