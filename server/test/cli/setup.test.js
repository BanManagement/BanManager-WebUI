// const assert = require('assert')
// const sinon = require('sinon')
// const setupStdin = require('mock-stdin')
// const stripAnsi = require('strip-ansi')
// const wait = require('util').promisify(setTimeout)
// const { createSetup } = require('../lib')
// const { handler } = require('../../cli/commands/setup')
// const keys = {
//   enter: '\x0D',
//   space: '\x20'
// }

// // Note, these tests should be run in series and not parallel
// describe('Execute bm-api setup', () => {
//   let setup
//   let stdin
//   let callItr
//   const getNext = (stub) => stripAnsi(stub.getCall(callItr++).args[0].trim()).trim()

//   beforeAll(async () => {
//     setup = await createSetup()
//   })

//   afterAll(async () => {
//     await setup.teardown()//   })

//   beforeEach(() => {
//     callItr = 0
//     stdin = setupStdin.stdin()
//   })

//   afterEach(() => {
//     stdin.restore()
//   })

//   test('should generate a .env file', async done => {
//     const stub = sinon.stub(process.stdout, 'write')
//     handler().then(done)

//     await wait(500)
//     stdin.send(keys.enter)
//     await wait(500)
//     stdin.send(keys.enter)
//     await wait(500)
//     stdin.send(keys.enter)
//     await wait(500)
//     stdin.send(keys.enter)
//     await wait(500)
//     stdin.send(`testing@banmanagement.com${keys.enter}`)
//     await wait(500)

//     stub.restore()

//     assert.strictEqual(getNext(stub), 'Starting setup')
//     assert.strictEqual(getNext(stub), 'If unsure, use default')
//     assert.strictEqual(getNext(stub), '')

//     assert.strictEqual(getNext(stub), '? BanManager UI Site Hostname (http://localhost:3000)')
//     assert.strictEqual(getNext(stub), '')

//     stub.getCalls().forEach((call, i) => console.log(`${i} ${call.args[0]}`))

//     assert.strictEqual(getNext(stub), '? Port to run API (3001)')
//     assert.strictEqual(getNext(stub), '')

//     assert.strictEqual(getNext(stub), '? Cookie session name (bm-ui-sess)')
//     assert.strictEqual(getNext(stub), '')
//   })
// }).timeout('10s')
