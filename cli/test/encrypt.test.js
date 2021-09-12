// const {expect, test} = require('@oclif/test')
const nixt = require('nixt')
const crypto = require('../../server/data/crypto')

describe('encrypt', () => {
  test('should encrypt a value', done => {
    nixt()
      .env('ENCRYPTION_KEY', (await crypto.createKey()).toString('hex'))
      .run('./bin/run encrypt')
      .on(/Value to encrypt/).respond('test\n')
      .stdout(/Encrypted value/)
      .end(done)
  })
})
