const { parseResolveInfo } = require('graphql-parse-resolve-info')
const { getSql } = require('../../utils')

module.exports = async function role (obj, { id }, { state }, info) {
  const fields = parseResolveInfo(info)
  const query = getSql(info.schema, {
    pool: state.dbPool,
    config: {
      tables: {
        roles: 'bm_web_roles'
      }
    }
  }, fields, 'roles').where('role_id', id)
  const [data] = await query.exec()

  return data
}
