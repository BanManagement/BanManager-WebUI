import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default Model.extend(
{ actor: belongsTo('player')
, reason: attr('string')
, state: belongsTo('state')
, asignee: belongsTo('player')
, created: attr('timestamp')
, updated: attr('timestamp')
, server: belongsTo('server')
})
