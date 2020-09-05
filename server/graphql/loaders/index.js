const player = require('./player-loader')

module.exports = (ctx) => {
  return {
    player: player(ctx)
  }
}
