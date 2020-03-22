module.exports = async function playerBan (obj, { id, serverId: server }, { state }) {
  const data = await state.loaders.playerBan.serverDataId.load({ server: server, id })

  return data
}
