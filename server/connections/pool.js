const knex = require('knex')
const { attachOnDuplicateUpdate } = require('knex-on-duplicate-update')

attachOnDuplicateUpdate()

module.exports = (config, logger, pool = { min: 0, max: 5 }) => {
  return knex({
    client: 'mysql2',
    asyncStackTraces: true,
    connection: config,
    pool
  })
}
