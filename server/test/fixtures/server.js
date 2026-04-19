const { randomBytes } = require('crypto')
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
  // BM_DB_HOST/PORT/USER override DB_* when the seeding script and the
  // WebUI process would reach the BM database at different addresses
  // (e.g. CI's docker compose smoke job: the seed runs on the runner and
  // uses 127.0.0.1:3306, but the WebUI container reaches MySQL via the
  // compose service name `mysql`). Local jest/setup_e2e flows leave them
  // unset and fall through to the existing DB_* behaviour.
  const portValue = process.env.BM_DB_PORT || process.env.DB_PORT
  const port = portValue ? Number.parseInt(portValue, 10) : 3306

  const server = {
    id: randomBytes(4).toString('hex'),
    name: 'Test' + randomBytes(2).toString('hex'),
    host: process.env.BM_DB_HOST || process.env.DB_HOST || '127.0.0.1',
    port,
    database,
    user: process.env.BM_DB_USER || process.env.DB_USER || 'root',
    password: '',
    console: consoleId,
    tables
  }

  if (process.env.DB_PASSWORD) {
    server.password = process.env.DB_PASSWORD
  }

  return server
}
