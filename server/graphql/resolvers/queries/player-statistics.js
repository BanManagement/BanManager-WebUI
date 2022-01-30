module.exports = async function playerStatistics (obj, { player }, { state }) {
  const servers = await Promise.all(Array.from(state.serversPool.values()).map(async ({ config, pool }) => {
    const { totalActiveBans } = await pool(config.tables.playerBans)
      .select(pool.raw('COUNT(*) AS `totalActiveBans`'))
      .where('player_id', player)
      .first()
    const { totalActiveMutes } = await pool(config.tables.playerMutes)
      .select(pool.raw('COUNT(*) AS `totalActiveMutes`'))
      .where('player_id', player)
      .first()
    const { totalBans } = await pool(config.tables.playerBanRecords)
      .select(pool.raw('COUNT(*) AS `totalBans`'))
      .where('player_id', player)
      .first()
    const { totalMutes } = await pool(config.tables.playerMuteRecords)
      .select(pool.raw('COUNT(*) AS `totalMutes`'))
      .where('player_id', player)
      .first()
    const { totalWarnings } = await pool(config.tables.playerWarnings)
      .select(pool.raw('COUNT(*) AS `totalWarnings`'))
      .where('player_id', player)
      .first()
    const { totalReports } = await pool(config.tables.playerReports)
      .select(pool.raw('COUNT(*) AS `totalReports`'))
      .where('player_id', player)
      .first()

    return { totalActiveBans, totalActiveMutes, totalBans, totalMutes, totalWarnings, totalReports }
  }))

  const data = servers.reduce((prev, curr) => ({
    totalActiveBans: prev.totalActiveBans + curr.totalActiveBans,
    totalActiveMutes: prev.totalActiveMutes + curr.totalActiveMutes,
    totalBans: prev.totalBans + curr.totalBans,
    totalMutes: prev.totalMutes + curr.totalMutes,
    totalWarnings: prev.totalWarnings + curr.totalWarnings,
    totalReports: prev.totalReports + curr.totalReports
  }))

  return data
}
