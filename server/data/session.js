const keys = ['playerId', 'created', 'updated', 'type']

module.exports = {
  create (playerId, updated, type) {
    const created = Math.floor(Date.now() / 1000) // @TODO Use MySQL time here, in case multiple API servers drift?

    return {
      playerId,
      created,
      updated: updated || created,
      type
    }
  },
  valid (data) {
    if (!data) return false

    return keys.filter(key => !!data[key]).length === keys.length
  }
}
