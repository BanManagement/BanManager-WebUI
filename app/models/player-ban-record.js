import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default Model.extend(
{ reason: attr('string')
, createdReason: attr('string')
, actor: belongsTo('player')
, pastActor: belongsTo('player')
, created: attr('timestamp')
, pastCreated: attr('timestamp')
, expired: attr('timestamp')
, server: belongsTo('server')
})
