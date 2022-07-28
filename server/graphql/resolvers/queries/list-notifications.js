const { parseResolveInfo, simplifyParsedResolveInfoFragmentWithType } = require('graphql-parse-resolve-info')
const ExposedError = require('../../../data/exposed-error')
const { getNotificationType, getNotificationState } = require('../../../data/notification')

module.exports = async function listNotifications (obj, { limit, offset }, { session, state }, info) {
  if (limit > 50) throw new ExposedError('Limit too large')

  const data = {}
  const filter = state.dbPool('bm_web_notifications AS n1')
    .select(state.dbPool.raw('MIN(n1.id)'))
    .where('n1.server_id', '=', state.dbPool.raw('n.server_id'))
    .andWhere(builder => {
      builder
        .where('n1.report_id', '=', state.dbPool.raw('n.report_id'))
        .orWhereNull('n1.report_id')
    })
    .andWhere('n1.player_id', '=', state.dbPool.raw('n.player_id'))
    .andWhere(builder => {
      builder
        .where('n1.appeal_id', '=', state.dbPool.raw('n.appeal_id'))
        .orWhereNull('n1.appeal_id')
    })
  const parsedResolveInfoFragment = parseResolveInfo(info)
  const { fields } = simplifyParsedResolveInfoFragmentWithType(parsedResolveInfoFragment, info.returnType)

  if (fields.total) {
    const { total } = await state.dbPool('bm_web_notifications AS n')
      .select(state.dbPool.raw('COUNT(*) as total'))
      .where('n.id', '=', filter)
      .andWhere({
        player_id: session.playerId
      })
      .first()

    data.total = total
  }

  if (fields.records) {
    const results = await state.dbPool('bm_web_notifications AS n')
      .where('n.id', '=', filter)
      .andWhere({
        player_id: session.playerId
      })
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
