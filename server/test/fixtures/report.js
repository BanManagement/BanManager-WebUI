const { date, lorem } = require('faker')

module.exports = function (player, actor, assignee, stateId = 1) {
  const created = Math.round((new Date(date.past()).getTime() / 1000))

  return {
    player_id: player.id ? player.id : player,
    actor_id: actor.id ? actor.id : actor,
    assignee_id: assignee ? assignee.id : undefined,
    reason: lorem.sentence(),
    created,
    updated: created,
    state_id: stateId
  }
}
