const player = require('./player-loader')
const playerPunishment = require('./player-punishment-loader')
const role = require('./role-loader')
const report = require('./report-loader')
const reportComment = require('./report-comment-loader')

module.exports = (ctx) => {
  return {
    player: player(ctx),
    playerBan: playerPunishment(ctx, 'playerBans', 'player.bans'),
    playerKick: playerPunishment(ctx, 'playerKicks', 'player.kicks'),
    playerMute: playerPunishment(ctx, 'playerMutes', 'player.mutes'),
    playerNote: playerPunishment(ctx, 'playerNotes', 'player.notes'),
    playerWarning: playerPunishment(ctx, 'playerWarnings', 'player.warnings'),
    role: role(ctx),
    report: report(ctx),
    reportComment: reportComment(ctx)
  }
}
