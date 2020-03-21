const { date, lorem } = require('faker')

module.exports = function (player, actor) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    player_id: player.id ? player.id : player,
    actor_id: actor.id ? actor.id : actor,
    reason: lorem.sentence(),
    created,
    updated: created,
    state_id: 1
  }
}
