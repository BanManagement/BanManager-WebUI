import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default Model.extend(
{ reason: attr('string')
, actor: belongsTo('player')
, created: attr('timestamp')
, updated: attr('timestamp')
, expires: attr('timestamp')
, read: attr('boolean')
, points: attr('number')
, server: belongsTo('server')
})
