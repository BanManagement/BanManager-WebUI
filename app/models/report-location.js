import DS from 'ember-data'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default DS.Model.extend(
{ player: belongsTo('player')
, world: attr('string')
, x: attr('number')
, y: attr('number')
, z: attr('number')
, pitch: attr('number')
, yaw: attr('number')
})
