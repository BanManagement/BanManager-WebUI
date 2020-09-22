const assert = require('assert')
const { hash } = require('../../data/hash')

module.exports = async function (request, server, player) {
  await server.pool('bm_player_pins').insert({ player_id: player.id, pin: await hash('123456'), expires: Math.floor(Date.now() / 1000) + 1000 })

  const { header, statusCode } = await request
    .post('/api/session')
    .set('Accept', 'application/json')
    .send({ name: player.name, pin: '123456', serverId: server.config.id })

  assert.strictEqual(statusCode, 200)

  const cookie = header['set-cookie'].join(';')

  return cookie
}
