require('dotenv').config()

const path = require('path')
const fs = require('fs')
const DBMigrate = require('db-migrate')
const { unparse, parse } = require('uuid-parse')
const { setupPool } = require('../server/connections')
const {
  createServer,
  createPlayer,
  createBan,
  createMute,
  createWarning,
  createNote,
  createReport,
  createReportComment,
  createAppeal
} = require('../server/test/fixtures')
const createAppealComment = require('../server/test/fixtures/appeal-comment')
const { hash } = require('../server/data/hash')
const { encrypt } = require('../server/data/crypto')

;(async () => { // eslint-disable-line max-statements
  const dbName = 'bm_e2e_tests'
  const dbConfig =
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    }
  let dbPool = await setupPool(dbConfig)

  await dbPool.raw(`DROP DATABASE IF EXISTS ${dbName}`)
  await dbPool.raw(`CREATE DATABASE ${dbName}`)
  await dbPool.destroy()

  dbConfig.database = dbName

  console.log(`Using database ${dbName}`)

  // Recreate the pool, as USE DATABASE would only apply to one connection, not the whole pool?
  // @TODO Confirm above
  dbPool = await setupPool(dbConfig)

  // Run migrations, then 'test' migrations
  const dbmConfig = {
    connectionLimit: 1,
    host: dbConfig.host,
    port: parseInt(dbConfig.port, 10) || 3306,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    multipleStatements: true,
    driver: { require: '@confuser/db-migrate-mysql' }
  }

  let dbmOpts = {
    throwUncatched: true,
    config: { dev: dbmConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'data', 'migrations') }
  }
  let dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  dbmOpts = {
    throwUncatched: true,
    config: { dev: dbmConfig },
    cmdOptions: { 'migrations-dir': path.join(__dirname, '..', 'server', 'test', 'migrations') }
  }
  dbm = DBMigrate.getInstance(true, dbmOpts)

  dbm.silence(true)

  await dbm.up()

  const playerConsole = createPlayer({ name: 'Console' })
  const guestUser = createPlayer({ name: 'GuestPlayer' })
  const loggedInUser = createPlayer({ name: 'RegularUser' })
  const adminUser = createPlayer({ id: parse('ae51c849-3f2a-4a37-986d-55ed5b02307f', Buffer.alloc(16)), name: 'confuser' })
  // PIN-only player has no bm_web_users row; used for the registration journey
  // where a player logs in via PIN and creates a brand new account.
  const pinOnlyPlayer = createPlayer({ name: 'PinNewbie' })

  // Extra players to support deeper journeys. Index meanings:
  //   0 unbanned target for moderation journeys (must stay clean)
  //   1 banned target with active ban + mute + warning (appeal journey)
  //   2-4 reporters/reported players for reports/appeals
  //   5-9 historical / filler players
  const extraPlayers = [
    createPlayer({ name: 'CleanSlate' }),
    createPlayer({ name: 'GrieferOne' }),
    createPlayer({ name: 'HackerTwo' }),
    createPlayer({ name: 'ToxicThree' }),
    createPlayer({ name: 'SpammerFour' }),
    createPlayer({ name: 'CheaterFive' }),
    createPlayer({ name: 'RuleBreakerSix' }),
    createPlayer({ name: 'NewSeven' }),
    createPlayer({ name: 'VeteranEight' }),
    createPlayer({ name: 'ModNine' })
  ]
  const unbannedPlayer = extraPlayers[0]
  const bannedPlayer = extraPlayers[1]

  await dbPool('bm_players').insert([playerConsole, guestUser, loggedInUser, adminUser, pinOnlyPlayer, ...extraPlayers])

  await dbPool('bm_web_player_roles').insert([
    { player_id: guestUser.id, role_id: 1 },
    { player_id: loggedInUser.id, role_id: 2 },
    { player_id: adminUser.id, role_id: 3 }
  ])

  const updated = Math.floor(Date.now() / 1000)

  // E2E test admin password - must match cypress.config.js default
  const e2eAdminPassword = 'xK9mQp2LvR7nS4jT'
  const e2eAdminEmail = 'admin@banmanagement.com'

  await dbPool('bm_web_users').insert([
    { player_id: guestUser.id, email: 'guest@banmanagement.com', password: await hash('testing'), updated },
    { player_id: loggedInUser.id, email: 'user@banmanagement.com', password: await hash('testing'), updated },
    { player_id: adminUser.id, email: e2eAdminEmail, password: await hash(e2eAdminPassword), updated }
  ])

  const server = await createServer(playerConsole.id, dbName)

  if (server.password && process.env.ENCRYPTION_KEY) {
    server.password = await encrypt(process.env.ENCRYPTION_KEY, server.password)
  }

  await dbPool('bm_web_servers').insert(server)

  // Second BanManager server (same physical DB) so the role-assignment server picker
  // is exercised. Display name only - both rows point at the same schema.
  const secondServer = await createServer(playerConsole.id, dbName)
  secondServer.name = 'SecondServer'

  if (secondServer.password && process.env.ENCRYPTION_KEY) {
    secondServer.password = await encrypt(process.env.ENCRYPTION_KEY, secondServer.password)
  }

  await dbPool('bm_web_servers').insert(secondServer)

  const adminBan = createBan(adminUser, playerConsole)
  await dbPool('bm_player_bans').insert(adminBan)

  const [banResult] = await dbPool('bm_player_bans').select('id').where({ player_id: adminUser.id }).limit(1)
  const banId = banResult.id

  // Active punishments for `bannedPlayer` so the appeal lifecycle journey has
  // ban + mute + warning rows it can pick from.
  const bannedPlayerBan = createBan(bannedPlayer, adminUser)
  const bannedPlayerMute = createMute(bannedPlayer, adminUser)
  const bannedPlayerWarning = createWarning(bannedPlayer, adminUser)

  await dbPool('bm_player_bans').insert(bannedPlayerBan)
  await dbPool('bm_player_mutes').insert(bannedPlayerMute)
  await dbPool('bm_player_warnings').insert(bannedPlayerWarning)

  const [bannedPlayerBanRow] = await dbPool('bm_player_bans').select('id').where({ player_id: bannedPlayer.id }).limit(1)
  const [bannedPlayerMuteRow] = await dbPool('bm_player_mutes').select('id').where({ player_id: bannedPlayer.id }).limit(1)
  const [bannedPlayerWarningRow] = await dbPool('bm_player_warnings').select('id').where({ player_id: bannedPlayer.id }).limit(1)

  // Sprinkle additional historical-ish punishments so PlayerStatistics / list views
  // have something to render in the moderation spec.
  await dbPool('bm_player_bans').insert([
    createBan(extraPlayers[2], adminUser),
    createBan(extraPlayers[3], playerConsole)
  ])
  await dbPool('bm_player_mutes').insert([
    createMute(extraPlayers[4], adminUser)
  ])
  await dbPool('bm_player_warnings').insert([
    createWarning(extraPlayers[2], adminUser),
    createWarning(extraPlayers[5], adminUser)
  ])
  await dbPool('bm_player_notes').insert([
    createNote(extraPlayers[2], adminUser),
    createNote(extraPlayers[3], adminUser)
  ])

  // Reports at each of the 4 states. The first (open) one is what the report
  // lifecycle journey will walk through state changes.
  const openReport = createReport(extraPlayers[2], extraPlayers[6], null, 1)
  const assignedReport = createReport(extraPlayers[3], extraPlayers[7], adminUser, 2)
  const resolvedReport = createReport(extraPlayers[4], extraPlayers[8], adminUser, 3)
  const closedReport = createReport(extraPlayers[5], extraPlayers[9], adminUser, 4)

  const [openReportId] = await dbPool('bm_player_reports').insert(openReport)
  const [assignedReportId] = await dbPool('bm_player_reports').insert(assignedReport)
  await dbPool('bm_player_reports').insert(resolvedReport)
  await dbPool('bm_player_reports').insert(closedReport)

  await dbPool('bm_player_report_comments').insert([
    createReportComment(openReportId, adminUser),
    createReportComment(openReportId, extraPlayers[6]),
    createReportComment(assignedReportId, adminUser)
  ])

  // Appeals at each state, attached to the non-admin user only so that
  // adminBan and the bannedPlayer punishments stay un-appealed and remain
  // valid for the appeal lifecycle journey.
  const userBan = createBan(loggedInUser, adminUser)
  await dbPool('bm_player_bans').insert(userBan)
  const [userBanRow] = await dbPool('bm_player_bans').select('id').where({ player_id: loggedInUser.id }).limit(1)
  userBan.id = userBanRow.id

  const userMute = createMute(loggedInUser, adminUser)
  await dbPool('bm_player_mutes').insert(userMute)
  const [userMuteRow] = await dbPool('bm_player_mutes').select('id').where({ player_id: loggedInUser.id }).limit(1)
  userMute.id = userMuteRow.id

  // Un-appealed warning for loggedInUser so the appeal-lifecycle journey can
  // submit a brand new appeal end-to-end.
  const userWarning = createWarning(loggedInUser, adminUser)
  await dbPool('bm_player_warnings').insert(userWarning)
  const [userWarningRow] = await dbPool('bm_player_warnings').select('id').where({ player_id: loggedInUser.id }).limit(1)
  userWarning.id = userWarningRow.id

  const openAppeal = createAppeal(userBan, 'PlayerBan', server, loggedInUser, null, 1)
  const assignedAppeal = createAppeal(userMute, 'PlayerMute', server, loggedInUser, adminUser, 2)

  const [openAppealId] = await dbPool('bm_web_appeals').insert(openAppeal)
  const [assignedAppealId] = await dbPool('bm_web_appeals').insert(assignedAppeal)

  await dbPool('bm_web_appeal_comments').insert([
    { ...createAppealComment(openAppealId, loggedInUser), type: 0 },
    { ...createAppealComment(openAppealId, adminUser), type: 0 },
    { ...createAppealComment(assignedAppealId, loggedInUser), type: 0 }
  ])

  // Hashed PIN rows for the forgotten-password / PIN login journeys. Pins are
  // valid for 10 minutes from seed time which comfortably outlasts the suite.
  // PINs live in the BM-side bm_player_pins table; in e2e the WebUI DB doubles
  // as the BM DB (single physical schema) so dbPool is the right pool here.
  // - loggedInUser: account exists, used by forgotten-password redirect to /account/password
  // - pinOnlyPlayer: account does NOT exist, used by registration journey
  await dbPool('bm_player_pins').insert([
    {
      player_id: loggedInUser.id,
      pin: await hash('123456'),
      expires: Math.floor(Date.now() / 1000) + 600
    },
    {
      player_id: pinOnlyPlayer.id,
      pin: await hash('654321'),
      expires: Math.floor(Date.now() / 1000) + 600
    }
  ])

  // Notification rule firing for APPEAL_CREATED -> super admin (role 3) so the
  // appeal lifecycle journey can assert the admin sees the notification.
  const [notificationRuleId] = await dbPool('bm_web_notification_rules').insert({
    type: 'APPEAL_CREATED',
    server_id: null,
    created: updated,
    updated
  })
  await dbPool('bm_web_notification_rule_roles').insert({ notification_rule_id: notificationRuleId, role_id: 3 })

  const fixtureData = {
    serverId: server.id,
    secondServerId: secondServer.id,
    banId,
    userPlayerId: unparse(loggedInUser.id),
    pinPlayerName: loggedInUser.name,
    pinValue: '123456',
    pinOnlyPlayerName: pinOnlyPlayer.name,
    pinOnlyPlayerId: unparse(pinOnlyPlayer.id),
    pinOnlyPinValue: '654321',
    unbannedPlayerId: unparse(unbannedPlayer.id),
    bannedPlayerId: unparse(bannedPlayer.id),
    bannedPlayerName: bannedPlayer.name,
    bannedPlayerBanId: bannedPlayerBanRow.id,
    bannedPlayerMuteId: bannedPlayerMuteRow.id,
    bannedPlayerWarningId: bannedPlayerWarningRow.id,
    userWarningId: userWarningRow.id,
    openReportId,
    assignedReportId,
    openAppealId,
    assignedAppealId,
    notificationRuleId
  }
  fs.writeFileSync(
    path.join(__dirname, 'fixtures', 'e2e-data.json'),
    JSON.stringify(fixtureData, null, 2)
  )

  console.log('E2E test data:', fixtureData)

  await dbPool.destroy()
})().catch(error => console.error(error))
