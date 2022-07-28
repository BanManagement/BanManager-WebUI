const { gql } = require('apollo-server-koa')
const { EOL } = require('os')
const { tables } = require('../data/tables')
const tableTypes = Object.keys(tables).map(table => `${table}: String`).join(EOL)
const tableTypesRequired = Object.keys(tables).map(table => `${table}: String!`).join(EOL)

/* eslint max-len: 0 */
module.exports = gql`

scalar IPAddress
scalar Timestamp
scalar UUID
scalar JSONObject

enum CacheControlScope {
  PUBLIC
  PRIVATE
}

directive @cacheControl(
  maxAge: Int
  scope: CacheControlScope
  inheritMaxAge: Boolean
) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION
directive @sqlColumn(name: String!) on FIELD_DEFINITION

type Server @sqlTable(name: "servers") {
  id: ID!
  name: String!
  host: String! @allowIf(resource: "servers", permission: "manage")
  port: Int! @allowIf(resource: "servers", permission: "manage")
  database: String! @allowIf(resource: "servers", permission: "manage")
  user: String! @allowIf(resource: "servers", permission: "manage")
  console: Player! @allowIf(resource: "servers", permission: "manage")
  tables: ServerTables! @allowIf(resource: "servers", permission: "manage")
  timeOffset: Timestamp!
}

type ServerTables {
  ${tableTypes}
}

type EntityACL {
  create: Boolean!
  update: Boolean!
  delete: Boolean!
  actor: Boolean!
  yours: Boolean!
}

type Player @sqlTable(name: "players") {
  id: UUID! @cacheControl(scope: PUBLIC, maxAge: 3600)
  name: String! @cacheControl(scope: PUBLIC, maxAge: 3600)
  ip: IPAddress @allowIf(resource: "player.ips", permission: "view")
  lastSeen: Timestamp! @cacheControl(scope: PUBLIC, maxAge: 300)
  server: Server!
}

type User @sqlTable(name: "users") {
  id: UUID! @sqlColumn(name: "player_id")
  email: String @allowIf(resource: "servers", permission: "manage")
  roles: [UserRole!]! @allowIf(resource: "servers", permission: "manage") @sqlRelation(joinOn: "id", field: "player_id", whereKey: "player_id", table: "playerRoles", joinType: "leftJoin")
  serverRoles: [UserServerRole!]! @allowIf(resource: "servers", permission: "manage") @sqlRelation(joinOn: "id", field: "player_id", whereKey: "player_id", table: "playerServerRoles", joinType: "leftJoin")
  player: Player
}

type UserRole @sqlTable(name: "playerRoles") {
  role: Role! @sqlRelation(joinOn: "role_id", field: "role_id", table: "roles")
}

type UserServerRole @sqlTable(name: "playerServerRoles") {
  serverRole: Role! @sqlRelation(joinOn: "role_id", field: "role_id", table: "roles")
  server: Server! @sqlRelation(joinOn: "id", field: "server_id", table: "servers")
}

type UserList {
  total: Int!
  records: [User!]
}

type PlayerBan @sqlTable(name: "playerBans") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  acl: EntityACL!
  server: Server!
}

type PlayerBanRecord @sqlTable(name: "playerBanRecords") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  pastActor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "pastActor_id", table: "players", joinType: "leftJoin")
  reason: String!
  createdReason: String!
  silent: Boolean!
  created: Timestamp!
  pastCreated: Timestamp!
  expired: Timestamp!
  acl: EntityACL!
  server: Server!
}

type PlayerKick @sqlTable(name: "playerKicks") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  acl: EntityACL!
}

type PlayerSessionHistory @sqlTable(name: "playerHistory") {
  id: ID!
  ip: IPAddress! @allowIf(resource: "player.ips", permission: "view")
  join: Timestamp!
  leave: Timestamp!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
}

type PlayerMute @sqlTable(name: "playerMutes") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  soft: Boolean!
  acl: EntityACL!
  server: Server!
}

type PlayerMuteRecord @sqlTable(name: "playerMuteRecords") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  pastActor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "pastActor_id", table: "players", joinType: "leftJoin")
  reason: String!
  createdReason: String!
  silent: Boolean!
  soft: Boolean!
  created: Timestamp!
  pastCreated: Timestamp!
  expired: Timestamp!
  acl: EntityACL!
  server: Server!
}

type PlayerNote @sqlTable(name: "playerNotes") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  message: String!
  created: Timestamp!
  acl: EntityACL!
  server: Server!
}

type PlayerReportList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerReport!]! @cacheControl(scope: PUBLIC, maxAge: 300)
  server: Server!
}

type PlayerReportCommentList {
  total: Int!
  records: [PlayerReportComment!]!
}

type PlayerAppealList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerAppeal!]! @cacheControl(scope: PUBLIC, maxAge: 300)
  server: Server!
}

type PlayerAppealCommentList {
  total: Int!
  records: [PlayerAppealComment!]!
}

type PlayerBanList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerBan!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerMuteList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerMute!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerWarningList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerWarning!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerSessionHistoryList {
  total: Int! @cacheControl(scope: PUBLIC, maxAge: 300)
  records: [PlayerSessionHistory!]! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PlayerReport @sqlTable(name: "playerReports") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  assignee: Player @sqlRelation(joinOn: "id", field: "assignee_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  state: PlayerReportState! @sqlRelation(joinOn: "id", field: "state_id", table: "playerReportStates")
  playerLocation: PlayerReportLocation @sqlRelation(joinOn: "player_id", field: "player_id", table: "playerReportLocations", joinType: "leftJoin")
  actorLocation: PlayerReportLocation @sqlRelation(joinOn: "player_id", field: "actor_id", table: "playerReportLocations", joinType: "leftJoin")
  acl: PlayerReportACL!
  serverLogs: [PlayerReportServerLog!] @sqlRelation(field: "id", table: "playerReportLogs", whereKey: "report_id") @allowIf(resource: "player.reports", permission: "view.serverlogs", serverSrc: "id")
  commands: [PlayerReportCommand!]  @sqlRelation(field: "id", table: "playerReportCommands", whereKey: "report_id") @allowIf(resource: "player.reports", permission: "view.commands", serverSrc: "id")
  viewerSubscription: Subscription @allowIfLoggedIn
}

type PlayerReportACL {
  state: Boolean!
  comment: Boolean!
  assign: Boolean!
  delete: Boolean!
}

type PlayerReportCommand @sqlTable(name: "playerReportCommands") {
  id: ID!
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players")
  command: String!
  args: String
  created: Timestamp!
  updated: Timestamp!
}

type PlayerReportLocation @sqlTable(name: "playerReportLocations") {
  world: String!
  x: Float!
  y: Float!
  z: Float!
  yaw: Float!
  pitch: Float!
}

type PlayerReportComment @sqlTable(name: "playerReportComments") {
  id: ID!
  comment: String!
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players")
  created: Timestamp!
  updated: Timestamp!
  acl: EntityACL!
}

type PlayerReportServerLog @sqlTable(name: "playerReportLogs") {
  id: ID!
  log: ServerLog! @sqlRelation(joinOn: "id", field: "log_id", table: "serverLogs")
}

type ServerLog {
  id: ID!
  message: String!
  created: Timestamp!
}

type PlayerReportState @sqlTable(name: "playerReportStates") {
  id: ID!
  name: String!
}

type PlayerAppeal @sqlTable(name: "appeals") {
  id: ID!
  server: Server! @sqlRelation(joinOn: "id", field: "server_id", table: "servers")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  assignee: Player @sqlRelation(joinOn: "id", field: "assignee_id", table: "players", joinType: "leftJoin")
  punishmentActor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "punishment_actor_id", table: "players", joinType: "leftJoin")
  punishmentType: RecordType! @sqlColumn(name: "punishment_type")
  punishmentCreated: Timestamp! @sqlColumn(name: "punishment_created")
  punishmentExpires: Timestamp! @sqlColumn(name: "punishment_expires")
  punishmentReason: String! @sqlColumn(name: "punishment_reason")
  punishmentSoft: Boolean @sqlColumn(name: "punishment_soft")
  punishmentPoints: Float @sqlColumn(name: "punishment_points")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  state: PlayerAppealState! @sqlRelation(joinOn: "id", field: "state_id", table: "appealStates")
  acl: PlayerAppealACL!
  viewerSubscription: Subscription @allowIfLoggedIn
}

type PlayerAppealACL {
  state: Boolean!
  comment: Boolean!
  assign: Boolean!
  delete: Boolean!
}

type PlayerAppealUpdated {
  appeal: PlayerAppeal!
  comment: PlayerAppealComment!
}

type PlayerAppealState @sqlTable(name: "appealStates") {
  id: ID!
  name: String!
}

type PlayerAppealComment @sqlTable(name: "appealComments") {
  id: ID!
  type: String!
  content: String
  assignee: Player @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "assignee_id", table: "players")
  state: PlayerAppealState @sqlRelation(joinOn: "id", field: "state_id", table: "appealStates")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players")
  oldReason: String @sqlColumn(name: "old_reason")
  newReason: String @sqlColumn(name: "new_reason")
  oldExpires: Timestamp @sqlColumn(name: "old_expires")
  newExpires: Timestamp @sqlColumn(name: "new_expires")
  oldPoints: Float @sqlColumn(name: "old_points")
  newPoints: Float @sqlColumn(name: "new_points")
  oldSoft: Boolean @sqlColumn(name: "old_soft")
  newSoft: Boolean @sqlColumn(name: "new_soft")
  created: Timestamp!
  updated: Timestamp!
  acl: EntityACL!
}

type EntityTypeACL {
  create: Boolean!
  update: Boolean!
  delete: Boolean!
}

type PlayerWarning @sqlTable(name: "playerWarnings") {
  id: ID!
  player: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "player_id", table: "players")
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600) @sqlRelation(joinOn: "id", field: "actor_id", table: "players", joinType: "leftJoin")
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  read: Boolean!
  points: Float!
  acl: EntityACL!
  server: Server!
}

union PlayerPunishmentRecord = PlayerBanRecord | PlayerKick | PlayerMuteRecord | PlayerNote | PlayerWarning

type PlayerPunishmentRecords {
  total: Int!
  records: [PlayerPunishmentRecord!]
  server: Server!
}

type Me {
  id: UUID
  name: String
  email: String
  hasAccount: Boolean
  session: PlayerSession
  resources: [Resources!]
}

type PlayerSession {
  type: String!
}

type MenuItem {
  id: ID!
  name: String!
  href: String
}

type AdminMenuItem {
  id: ID!
  name: String!
  href: String
  label: Int
}

type Navigation @cacheControl(scope: PRIVATE, maxAge: 300) {
  left: [MenuItem!]! @cacheControl(scope: PRIVATE, maxAge: 300)
}

type AdminNavigation {
  left: [AdminMenuItem!]!
}

type Role @sqlTable(name: "roles") {
  id: ID! @sqlColumn(name: "role_id")
  name: String!
  parent: ID @sqlColumn(name: "parent_role_id")
  resources: [Resources!]
}

type Resources @sqlTable(name: "resources") {
  id: ID! @sqlColumn(name: "resource_id")
  name: String!
  permissions: [Permission]
}

type Permission {
  id: ID!
  name: String!
  allowed: Boolean!
  serversAllowed: [String!]
}

enum RecordType {
  PlayerBan
  PlayerBanRecord
  PlayerKick
  PlayerMute
  PlayerMuteRecord
  PlayerNote
  PlayerWarning
}

enum OrderByInput {
  created_ASC
  created_DESC
}

enum OrderBySessionHistoryInput {
  leave_ASC
  leave_DESC
  join_ASC
  join_DESC
}

type DeviceComponent {
  id: ID!
  component: String!
  x: Int!
  y: Int!
  w: Int!
  h: Int!
  meta: JSONObject
}

type ReusableDeviceComponent {
  component: String!
  x: Int
  y: Int
  w: Int
  h: Int
  meta: JSONObject
}

type PageDevice {
  components: [DeviceComponent!]! @cacheControl(scope: PUBLIC, maxAge: 300)
  unusedComponents: [DeviceComponent!]! @allowIf(resource: "servers", permission: "manage")
  reusableComponents: [ReusableDeviceComponent!]! @allowIf(resource: "servers", permission: "manage")
}

type PageDevices {
  mobile: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
  tablet: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
  desktop: PageDevice @cacheControl(scope: PUBLIC, maxAge: 300)
}

type PageLayout @cacheControl(scope: PUBLIC, maxAge: 300) {
  pathname: ID! @cacheControl(scope: PUBLIC, maxAge: 300)
  devices: PageDevices! @cacheControl(scope: PUBLIC, maxAge: 300)
}

type Statistics {
  totalActiveBans: Int!
  totalActiveMutes: Int!
  totalPlayers: Int!
  totalAppeals: Int!
}

type PlayerStatistics {
  totalActiveBans: Int!
  totalActiveMutes: Int!
  totalBans: Int!
  totalMutes: Int!
  totalReports: Int!
  totalWarnings: Int!
}

type Settings {
  serverFooterName: String!
}

type NotificationList {
  total: Int!
  records: [Notification!]!
}

type NotificationComment {
  id: ID!
  comment: String!
  actor: Player! @cacheControl(scope: PUBLIC, maxAge: 3600)
  created: Timestamp!
  updated: Timestamp!
  acl: EntityACL!
}

type Notification @sqlTable(name: "notifications") {
  id: ID!
  type: String!
  state: String!
  actor: Player
  report: PlayerReport
  appeal: PlayerAppeal
  comment: NotificationComment
  created: Timestamp!
  updated: Timestamp!
  server: Server
}

enum SubscriptionState {
  IGNORED
  SUBSCRIBED
}

type Subscription {
  state: SubscriptionState!
}

type Query {
  searchPlayers(name: String!, limit: Int = 10): [Player!]
  player(player: UUID!): Player
  playerInfo(player: UUID!): [Player!]
  playerAlts(player: UUID!): [Player!]
  listUsers(player: UUID, email: String, role: String, serverRole: String, limit: Int = 10, offset: Int = 0): UserList @allowIf(resource: "servers", permission: "manage")

  servers: [Server!]
  serverTables: [String!]
  server(id: ID!): Server

  playerBan(id: ID!, serverId: ID!): PlayerBan @allowIf(resource: "player.bans", permission: "view", serverVar: "serverId")
  playerBans(player: UUID!): [PlayerBan!] @allowIf(resource: "player.bans", permission: "view")
  listPlayerBans(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerBanList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.bans", permission: "view")

  playerKick(id: ID!, serverId: ID!): PlayerKick @allowIf(resource: "player.kicks", permission: "view", serverVar: "serverId")

  playerMute(id: ID!, serverId: ID!): PlayerMute @allowIf(resource: "player.mutes", permission: "view", serverVar: "serverId")
  playerMutes(player: UUID!): [PlayerMute!] @allowIf(resource: "player.mutes", permission: "view")
  listPlayerMutes(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerMuteList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.mutes", permission: "view")

  playerNote(id: ID!, serverId: ID!): PlayerNote @allowIf(resource: "player.notes", permission: "view", serverVar: "serverId")

  playerWarning(id: ID!, serverId: ID!): PlayerWarning @allowIf(resource: "player.warnings", permission: "view", serverVar: "serverId")
  listPlayerWarnings(serverId: ID!, actor: UUID, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerWarningList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.warnings", permission: "view")

  listPlayerPunishmentRecords(serverId: ID!, actor: UUID, player: UUID!, type: RecordType!, limit: Int = 20, offset: Int = 0, order: OrderByInput): PlayerPunishmentRecords! @cacheControl(scope: PRIVATE, maxAge: 300)

  me: Me

  navigation: Navigation!
  adminNavigation: AdminNavigation! @allowIf(resource: "servers", permission: "manage")

  pageLayout(pathname: String!): PageLayout!
  pageLayouts: [PageLayout!] @allowIf(resource: "servers", permission: "manage")

  roles(defaultOnly: Boolean): [Role!] @allowIf(resource: "servers", permission: "manage")
  role(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  resources: [Resources!] @allowIf(resource: "servers", permission: "manage")

  reportStates(serverId: ID!): [PlayerReportState!]
  report(id: ID!, serverId: ID!): PlayerReport
  listPlayerReports(serverId: ID!, actor: UUID, assigned: UUID, player: UUID, state: ID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerReportList!

  listPlayerReportComments(serverId: ID!, report: ID!, actor: UUID, order: OrderByInput): PlayerReportCommentList! @allowIf(resource: "player.reports", permission: "view.comments", serverVar: "serverId")
  reportComment(id: ID!, serverId: ID!): PlayerReportComment! @allowIf(resource: "player.reports", permission: "view.comments", serverVar: "serverId")

  listPlayerSessionHistory(serverId: ID!, player: UUID, limit: Int = 10, offset: Int = 0, order: OrderBySessionHistoryInput): PlayerSessionHistoryList! @cacheControl(scope: PRIVATE, maxAge: 300) @allowIf(resource: "player.history", permission: "view")

  appealStates: [PlayerAppealState!]
  appeal(id: ID!): PlayerAppeal!
  listPlayerAppeals(serverId: ID, actor: UUID, assigned: UUID, player: UUID, state: ID, limit: Int = 10, offset: Int = 0, order: OrderByInput): PlayerAppealList!

  listPlayerAppealComments(id: ID!, actor: UUID, order: OrderByInput): PlayerAppealCommentList! @allowIf(resource: "player.appeals", permission: "view.comments")
  appealComment(id: ID!): PlayerAppealComment! @allowIf(resource: "player.appeals", permission: "view.comments")

  statistics: Statistics! @cacheControl(scope: PUBLIC, maxAge: 3600)
  playerStatistics(player: UUID!): PlayerStatistics!

  settings: Settings!

  unreadNotificationCount: Int! @allowIfLoggedIn
  listNotifications(limit: Int = 25, offset: Int = 0): NotificationList! @allowIfLoggedIn
}

input CreatePlayerNoteInput {
  player: UUID!
  message: String @constraint(maxLength: 255)
  server: ID!
}

input UpdatePlayerNoteInput {
  message: String! @constraint(maxLength: 255)
}

input CreatePlayerBanInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  server: ID!
}

input UpdatePlayerBanInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
}

input CreatePlayerMuteInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  soft: Boolean!
  server: ID!
}

input UpdatePlayerMuteInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  soft: Boolean!
}

input CreatePlayerWarningInput {
  player: UUID!
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  server: ID!
  points: Float!
}

input UpdatePlayerWarningInput {
  reason: String! @constraint(maxLength: 255)
  expires: Timestamp!
  points: Float!
}


input CreateServerInput {
  name: String! @constraint(maxLength: 20)
  host: String! @constraint(maxLength: 255)
  port: Int!
  database: String! @constraint(maxLength: 255)
  user: String! @constraint(maxLength: 255)
  password: String
  console: UUID!
  tables: ServerTablesInput!
}

input UpdateServerInput {
  name: String! @constraint(maxLength: 20)
  host: String! @constraint(maxLength: 255)
  port: Int!
  database: String! @constraint(maxLength: 255)
  user: String! @constraint(maxLength: 255)
  password: String
  console: UUID!
  tables: ServerTablesInput!
}

input ServerTablesInput {
  ${tableTypesRequired}
}

input UpdateRoleInput {
  name: String! @constraint(maxLength: 20)
  parent: ID
  resources: [ResourceInput!]!
}

input ResourceInput {
  id: ID!
  name: String!
  permissions: [PermissionInput!]!
}

input PermissionInput {
  id: ID!
  name: String!
  allowed: Boolean!
}

input CreateAppealInput {
  serverId: ID!
  punishmentId: ID!
  type: RecordType!
  reason: String! @constraint(minLength: 20, maxLength: 65535)
  soft: Boolean
  points: Float
}

input AppealCommentInput {
  content: String! @constraint(minLength: 2, maxLength: 255)
}

input ReportCommentInput {
  comment: String! @constraint(minLength: 2, maxLength: 255)
}

input UpdatePageLayoutInput {
  mobile: PageLayoutDeviceInput!
  tablet: PageLayoutDeviceInput!
  desktop: PageLayoutDeviceInput!
}

input PageLayoutDeviceInput {
  components: [PageLayoutComponentInput!]!
  unusedComponents: [PageLayoutComponentInput!]!
}

input PageLayoutComponentInput {
  id: ID
  component: String!
  x: Int!
  y: Int!
  w: Int!
  h: Int!
  meta: JSONObject
}

input RoleInput {
  id: ID!
}

input ServerInput {
  id: ID!
}

input ServerRoleInput {
  role: RoleInput!
  server: ServerInput!
}

input SetRolesInput {
  roles: [RoleInput!]!
  serverRoles: [ServerRoleInput!]!
}

type Mutation {
  deletePunishmentRecord(id: ID!, serverId: ID!, type: RecordType!, keepHistory: Boolean!): ID!

  createPlayerNote(input: CreatePlayerNoteInput!): PlayerNote @allowIf(resource: "player.notes", permission: "create", serverVar: "input.server")
  updatePlayerNote(id: ID!, serverId: ID!, input: UpdatePlayerNoteInput!): PlayerNote @allowIf(resource: "player.notes", permission: "update.any", serverVar: "serverId")
  deletePlayerNote(id: ID!, serverId: ID!): PlayerNote @allowIfLoggedIn

  createPlayerBan(input: CreatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "create", serverVar: "input.server")
  updatePlayerBan(id: ID!, serverId: ID!, input: UpdatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "update.any", serverVar: "serverId")
  deletePlayerBan(id: ID!, serverId: ID!): PlayerBan @allowIfLoggedIn
  deletePlayerBanRecord(id: ID!, serverId: ID!): PlayerBanRecord @allowIfLoggedIn

  createPlayerMute(input: CreatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "create", serverVar: "input.server")
  updatePlayerMute(id: ID!, serverId: ID!, input: UpdatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "update.any", serverVar: "serverId")
  deletePlayerMute(id: ID!, serverId: ID!): PlayerMute @allowIfLoggedIn
  deletePlayerMuteRecord(id: ID!, serverId: ID!): PlayerMuteRecord @allowIfLoggedIn

  createPlayerWarning(input: CreatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "create", serverVar: "input.server")
  updatePlayerWarning(id: ID!, serverId: ID!, input: UpdatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "update.any", serverVar: "serverId")
  deletePlayerWarning(id: ID!, serverId: ID!): PlayerWarning @allowIfLoggedIn

  deletePlayerKick(id: ID!, serverId: ID!): PlayerKick @allowIfLoggedIn

  createServer(input: CreateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  updateServer(id: ID!, input: UpdateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  deleteServer(id: ID!): ID! @allowIf(resource: "servers", permission: "manage")

  createRole(input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  updateRole(id: ID!, input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  deleteRole(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  assignRole(players: [UUID!]!, role: Int!): Role! @allowIf(resource: "servers", permission: "manage")
  assignServerRole(players: [UUID!], role: Int!, serverId: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  setRoles(player: UUID!, input: SetRolesInput!): User! @allowIf(resource: "servers", permission: "manage")

  assignReport(report: ID!, serverId: ID!, player: UUID!): PlayerReport! @allowIfLoggedIn
  reportState(report: ID!, serverId: ID!, state: ID!): PlayerReport! @allowIfLoggedIn
  deleteReportComment(id: ID!, serverId: ID!): PlayerReportComment! @allowIfLoggedIn
  createReportComment(report: ID!, serverId: ID!, input: ReportCommentInput!): PlayerReportComment! @allowIfLoggedIn
  resolveReportBan(report: ID!, serverId: ID!, input: CreatePlayerBanInput!): PlayerReport! @allowIf(resource: "player.bans", permission: "create", serverVar: "serverId")
  resolveReportMute(report: ID!, serverId: ID!, input: CreatePlayerMuteInput!): PlayerReport! @allowIf(resource: "player.mutes", permission: "create", serverVar: "serverId")
  resolveReportWarning(report: ID!, serverId: ID!, input: CreatePlayerWarningInput!): PlayerReport! @allowIf(resource: "player.warnings", permission: "create", serverVar: "serverId")
  reportSubscriptionState(report: ID!, serverId: ID!, subscriptionState: SubscriptionState!): Subscription! @allowIfLoggedIn

  createAppeal(input: CreateAppealInput!): PlayerAppeal! @allowIfLoggedIn
  assignAppeal(id: ID!, player: UUID!): PlayerAppealUpdated! @allowIfLoggedIn
  appealState(id: ID!, state: ID!): PlayerAppealUpdated! @allowIfLoggedIn
  deleteAppealComment(id: ID!): PlayerAppealComment! @allowIfLoggedIn
  createAppealComment(id: ID!, input: AppealCommentInput!): PlayerAppealComment! @allowIfLoggedIn
  resolveAppealUpdateBan(id: ID!, input: UpdatePlayerBanInput!): PlayerAppealUpdated! @allowIfLoggedIn
  resolveAppealDeleteBan(id: ID!): PlayerAppealUpdated! @allowIfLoggedIn
  resolveAppealUpdateMute(id: ID!, input: UpdatePlayerMuteInput!): PlayerAppealUpdated! @allowIfLoggedIn
  resolveAppealDeleteMute(id: ID!): PlayerAppealUpdated! @allowIfLoggedIn
  resolveAppealUpdateWarning(id: ID!, input: UpdatePlayerWarningInput!): PlayerAppealUpdated! @allowIfLoggedIn
  resolveAppealDeleteWarning(id: ID!): PlayerAppealUpdated! @allowIfLoggedIn
  appealSubscriptionState(id: ID!, subscriptionState: SubscriptionState!): Subscription! @allowIfLoggedIn

  setPassword(currentPassword: String, newPassword: String!): Me! @allowIfLoggedIn
  setEmail(currentPassword: String!, email: String!): Me! @allowIfLoggedIn

  updatePageLayout(pathname: ID!, input: UpdatePageLayoutInput!): PageLayout @allowIf(resource: "servers", permission: "manage")
}`
