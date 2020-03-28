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

directive @allowIf(resource: String!, permission: String!, serverVar: String, serverSrc: String) on FIELD_DEFINITION
directive @allowIfLoggedIn on FIELD_DEFINITION
directive @constraint(
  minLength: Int
  maxLength: Int
  startsWith: String
  endsWith: String
  notContains: String
  pattern: String
  format: String

  min: Int
  max: Int
  exclusiveMin: Int
  exclusiveMax: Int
  multipleOf: Int
) on INPUT_FIELD_DEFINITION

type Server {
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

type Player {
  id: UUID!
  name: String!
  email: String @allowIf(resource: "servers", permission: "manage")
  lastSeen: Timestamp!
  servers: [PlayerServer!]!
  roles: [Role!]! @allowIf(resource: "servers", permission: "manage")
  serverRoles: [ServerRole!]! @allowIf(resource: "servers", permission: "manage")
}

type PlayerList {
  total: Int!
  players: [Player!]
}

type PlayerBan {
  id: ID!
  player: Player!
  actor: Player!
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  server: Server!
  acl: EntityACL!
}

type PlayerKick {
  id: ID!
  player: Player!
  actor: Player!
  reason: String!
  created: Timestamp!
  server: Server!
  acl: EntityACL!
}

type PlayerHistory {
  id: ID!
  ip: IPAddress!
  join: Timestamp!
  leave: Timestamp!
}

type PlayerMute {
  id: ID!
  player: Player!
  actor: Player!
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  soft: Boolean!
  server: Server!
  acl: EntityACL!
}

type PlayerNote {
  id: ID!
  player: Player!
  actor: Player!
  message: String!
  created: Timestamp!
  server: Server!
  acl: EntityACL!
}

type PlayerReportList {
  total: Int!
  reports: [PlayerReport!]!
}

type PlayerReport {
  id: ID!
  player: Player!
  actor: Player!
  assignee: Player
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  state: PlayerReportState!
  locations: PlayerReportLocations!
  server: Server!
  acl: PlayerReportACL!
  comments: [PlayerReportComment!] @allowIf(resource: "player.reports", permission: "view.comments", serverSrc: "id")
  serverLogs: [PlayerReportServerLog!] @allowIf(resource: "player.reports", permission: "view.serverlogs", serverSrc: "id")
  commands: [PlayerReportCommand!] @allowIf(resource: "player.reports", permission: "view.commands", serverSrc: "id")
}

type PlayerReportACL {
  state: Boolean!
  comment: Boolean!
  assign: Boolean!
  delete: Boolean!
}

type PlayerReportCommand {
  id: ID!
  actor: Player!
  command: String!
  args: String
  created: Timestamp!
  updated: Timestamp!
}

type PlayerReportLocations {
  player: PlayerLocation
  actor: PlayerLocation
}

type PlayerLocation {
  player: Player!
  world: String!
  x: Float!
  y: Float!
  z: Float!
  yaw: Float!
  pitch: Float!
}

type PlayerReportComment {
  id: ID!
  message: String!
  actor: Player!
  created: Timestamp!
  updated: Timestamp!
  acl: EntityACL!
}

type PlayerReportServerLog {
  id: ID!
  message: String!
  created: Timestamp!
}

type PlayerReportState {
  id: ID!
  name: String!
}

type EntityTypeACL {
  create: Boolean!
  update: Boolean!
  delete: Boolean!
}

type PlayerServerACL {
  bans: EntityTypeACL!
  kicks: EntityTypeACL!
  mutes: EntityTypeACL!
  notes: EntityTypeACL!
  warnings: EntityTypeACL!
}

type PlayerServer {
  id: ID!
  server: Server!
  lastSeen: Timestamp!
  ip: IPAddress @allowIf(resource: "player.ips", permission: "view")
  history: [PlayerHistory!] @allowIf(resource: "player.history", permission: "view")
  bans: [PlayerBan!] @allowIf(resource: "player.bans", permission: "view", serverSrc: "id")
  kicks: [PlayerKick!] @allowIf(resource: "player.kicks", permission: "view", serverSrc: "id")
  mutes: [PlayerMute!] @allowIf(resource: "player.mutes", permission: "view", serverSrc: "id")
  notes: [PlayerNote!] @allowIf(resource: "player.notes", permission: "view", serverSrc: "id")
  warnings: [PlayerWarning!] @allowIf(resource: "player.warnings", permission: "view", serverSrc: "id")
  alts: [Player!] @allowIf(resource: "player.alts", permission: "view", serverSrc: "id")
  acl: PlayerServerACL!
}

type PlayerWarning {
  id: ID!
  player: Player!
  actor: Player!
  reason: String!
  created: Timestamp!
  updated: Timestamp!
  expires: Timestamp!
  read: Boolean!
  points: Float!
  server: Server!
  acl: EntityACL!
}

type Me {
  id: UUID!
  name: String!
  email: String!
  hasAccount: Boolean!
  session: PlayerSession!
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

type Navigation {
  left: [MenuItem!]!
}

type AdminNavigation {
  left: [AdminMenuItem!]!
}

type Role {
  id: ID!
  name: String!
  parent: ID
  resources: [Resources!]
}

type ServerRole {
  server: Server!
  role: Role!
}

type Resources {
  id: ID!
  name: String!
  permissions: [Permission]
}

type Permission {
  id: ID!
  name: String!
  allowed: Boolean!
}

enum RecordType {
  PlayerBan
  PlayerKick
  PlayerMute
  PlayerNote
  PlayerWarning
}

type DeviceComponent {
  id: ID!
  component: String!
  x: Int!
  y: Int!
  w: Int!
  colour: String
  textAlign: String
  meta: JSONObject
}

type ReusableDeviceComponent {
  component: String!
  x: Int
  y: Int
  w: Int
  colour: String
  textAlign: String
  meta: JSONObject
}

type PageDevice {
  components: [DeviceComponent!]!
  unusedComponents: [DeviceComponent!]!
  reusableComponents: [ReusableDeviceComponent!]!
}

type PageDevices {
  mobile: PageDevice
  tablet: PageDevice
  desktop: PageDevice
}

type PageLayout {
  pathname: ID!
  devices: PageDevices!
}

type Query {
  searchPlayers(name: String!, limit: Int = 10): [Player!]
  player(id: UUID!): Player
  listPlayers(email: String, role: String, serverRole: String, limit: Int = 10, offset: Int = 0): PlayerList @allowIf(resource: "servers", permission: "manage")

  servers: [Server!]
  serverTables: [String!]
  server(id: ID!): Server @allowIf(resource: "servers", permission: "manage")

  playerBan(id: ID!, serverId: ID!): PlayerBan @allowIf(resource: "player.bans", permission: "view", serverVar: "serverId")
  playerKick(id: ID!, serverId: ID!): PlayerKick @allowIf(resource: "player.kicks", permission: "view", serverVar: "serverId")
  playerMute(id: ID!, serverId: ID!): PlayerMute @allowIf(resource: "player.mutes", permission: "view", serverVar: "serverId")
  playerNote(id: ID!, serverId: ID!): PlayerNote @allowIf(resource: "player.notes", permission: "view", serverVar: "serverId")
  playerWarning(id: ID!, serverId: ID!): PlayerWarning @allowIf(resource: "player.warnings", permission: "view", serverVar: "serverId")

  me: Me

  navigation: Navigation! @cacheControl(maxAge: 30, scope: PRIVATE)
  adminNavigation: AdminNavigation! @allowIf(resource: "servers", permission: "manage")

  pageLayout(pathname: String!): PageLayout! @cacheControl(maxAge: 30, scope: PUBLIC)
  pageLayouts: [PageLayout!] @allowIf(resource: "servers", permission: "manage")

  roles(defaultOnly: Boolean): [Role!] @allowIf(resource: "servers", permission: "manage")
  role(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  resources: [Resources!] @allowIf(resource: "servers", permission: "manage")

  reportStates(serverId: ID!): [PlayerReportState!]
  report(id: ID!, serverId: ID!): PlayerReport @allowIf(resource: "player.reports", permission: "view.any")
  listReports(actor: UUID, assigned: UUID, player: UUID, state: ID, limit: Int = 10, offset: Int = 0): PlayerReportList! @allowIf(resource: "player.reports", permission: "view.any")
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

input ReportCommentInput {
  message: String! @constraint(maxLength: 255)
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
  colour: String
  textAlign: String
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

  createPlayerBan(input: CreatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "create", serverVar: "input.server")
  updatePlayerBan(id: ID!, serverId: ID!, input: UpdatePlayerBanInput!): PlayerBan @allowIf(resource: "player.bans", permission: "update.any", serverVar: "serverId")

  createPlayerMute(input: CreatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "create", serverVar: "input.server")
  updatePlayerMute(id: ID!, serverId: ID!, input: UpdatePlayerMuteInput!): PlayerMute @allowIf(resource: "player.mutes", permission: "update.any", serverVar: "serverId")

  createPlayerWarning(input: CreatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "create", serverVar: "input.server")
  updatePlayerWarning(id: ID!, serverId: ID!, input: UpdatePlayerWarningInput!): PlayerWarning @allowIf(resource: "player.warnings", permission: "update.any", serverVar: "serverId")

  createServer(input: CreateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  updateServer(id: ID!, input: UpdateServerInput!): Server @allowIf(resource: "servers", permission: "manage")
  deleteServer(id: ID!): ID! @allowIf(resource: "servers", permission: "manage")

  createRole(input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  updateRole(id: ID!, input: UpdateRoleInput!): Role! @allowIf(resource: "servers", permission: "manage")
  deleteRole(id: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  assignRole(players: [UUID!]!, role: Int!): Role! @allowIf(resource: "servers", permission: "manage")
  assignServerRole(players: [UUID!], role: Int!, serverId: ID!): Role! @allowIf(resource: "servers", permission: "manage")
  setRoles(player: ID!, input: SetRolesInput!): Player! @allowIf(resource: "servers", permission: "manage")

  assignReport(report: ID!, serverId: ID!, player: UUID!): PlayerReport!
  reportState(report: ID!, serverId: ID!, state: ID!): PlayerReport!
  deleteReportComment(comment: ID!, serverId: ID!): PlayerReportComment!
  createReportComment(report: ID!, serverId: ID!, input: ReportCommentInput!): PlayerReportComment!

  setPassword(currentPassword: String, newPassword: String!): Me! @allowIfLoggedIn
  setEmail(currentPassword: String!, email: String!): Me! @allowIfLoggedIn

  updatePageLayout(pathname: ID!, input: UpdatePageLayoutInput!): PageLayout @allowIf(resource: "servers", permission: "manage")
}`
