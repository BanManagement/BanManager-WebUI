module.exports = function player (obj, { id }, { state }) {
  return state.loaders.player.ids.load(id)
}
