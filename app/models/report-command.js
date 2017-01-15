import DS from 'ember-data'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default DS.Model.extend(
{ actor: belongsTo('player')
, command: attr('string')
, args: attr('string')
, created: attr('timestamp')
, updated: attr('timestamp')
})
