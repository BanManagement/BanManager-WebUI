const assert = require('assert')
const { insert } = require('../../data/udify')
const { hash } = require('../../data/hash')

module.exports = async function (request, server, player) {
  await insert(server.pool, 'bm_player_pins', { player_id: player.id, pin: await hash('123456'), expires: 0 })

  const { header, statusCode } = await request
    .post('/api/session')
    .set('Accept', 'application/json')
    .send({ name: player.name, pin: '123456', serverId: server.config.id })

  assert.strictEqual(statusCode, 200)

  const cookie = header['set-cookie'].join(';')

  return cookie
}
