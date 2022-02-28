module.exports = async function statistics (obj, args, { state }) {
  const servers = await Promise.all(Array.from(state.serversPool.values()).map(async ({ config, pool }) => {
    const { totalActiveBans } = await pool(config.tables.playerBans)
      .select(pool.raw('COUNT(*) AS `totalActiveBans`'))
      .first()
    const { totalActiveMutes } = await pool(config.tables.playerMutes)
      .select(pool.raw('COUNT(*) AS `totalActiveMutes`'))
      .first()
    // NB: this will include duplicates
    const { totalPlayers } = await pool(config.tables.players)
      .select(pool.raw('COUNT(*) AS `totalPlayers`'))
      .first()

    return { totalActiveBans, totalActiveMutes, totalPlayers }
  }))

  const data = servers.reduce((prev, curr) => ({
    totalActiveBans: prev.totalActiveBans + curr.totalActiveBans,
    totalActiveMutes: prev.totalActiveMutes + curr.totalActiveMutes,
    totalPlayers: prev.totalPlayers + curr.totalPlayers
  }))

  const { totalAppeals } = await state.dbPool('bm_web_appeals')
    .select(state.dbPool.raw('COUNT(*) AS `totalAppeals`'))
    .first()

  data.totalAppeals = totalAppeals

  return data
}
