const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const { getNotificationType, getNotificationState } = require('../../../data/notification')

module.exports = async function listNotifications (obj, { limit, offset }, { session, state }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const data = {}
  const filter = {
    player_id: session.playerId
  }
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_notifications')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .where(filter)
      .first()

    data.total = total
  }

  if (fields.records) {
    const results = await state.dbPool('bm_web_notifications')
      .where(filter)
      .orderBy('updated', 'DESC')
      .limit(limit)
      .offset(offset)

    data.records = results.map(result => {
      if (fields.records.fieldsByTypeName.Notification.actor && result.actor_id) {
        result.actor = state.loaders.player.load({ id: result.actor_id, fields: ['name'] })
      }

      result.type = getNotificationType(result.type)
      result.state = getNotificationState(result.state_id)

      return result
    })
  }

  return data
}
