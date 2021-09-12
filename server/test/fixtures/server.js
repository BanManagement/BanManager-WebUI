const { randomBytes } = require('crypto')
const { encrypt } = require('../../data/crypto')
const tables = JSON.stringify(
  {
    players: 'bm_players',
    playerBans: 'bm_player_bans',
    playerBanRecords: 'bm_player_ban_records',
    playerMutes: 'bm_player_mutes',
    playerMuteRecords: 'bm_player_mute_records',
    playerKicks: 'bm_player_kicks',
    playerNotes: 'bm_player_notes',
    playerHistory: 'bm_player_history',
    playerPins: 'bm_player_pins',
    playerReports: 'bm_player_reports',
    playerReportCommands: 'bm_player_report_commands',
    playerReportComments: 'bm_player_report_comments',
    playerReportLocations: 'bm_player_report_locations',
    playerReportStates: 'bm_player_report_states',
    playerReportLogs: 'bm_report_logs',
    serverLogs: 'bm_server_logs',
    playerWarnings: 'bm_player_warnings',
    ipBans: 'bm_ip_bans',
    ipBanRecords: 'bm_ip_ban_records',
    ipMutes: 'bm_ip_mutes',
    ipMuteRecords: 'bm_ip_mute_records',
    ipRangeBans: 'bm_ip_range_bans',
    ipRangeBanRecords: 'bm_ip_range_ban_records'
  })

module.exports = async function (consoleId, database) {
  const server = {
    id: randomBytes(4).toString('hex'),
    name: 'Test' + randomBytes(2).toString('hex'),
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    database,
    user: process.env.DB_USER || 'root',
    password: '',
    console: consoleId,
    tables
  }

  if (process.env.DB_PASSWORD) {
    server.password = await encrypt(process.env.ENCRYPTION_KEY, process.env.DB_PASSWORD)
  }

  return server
}
