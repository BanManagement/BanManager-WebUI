import Ember from 'ember'
import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'

export default Model.extend(
{ reason: attr('string')
, 'player_id': attr('string')
, actor: belongsTo('player')
, created: attr('timestamp')
, updated: attr('timestamp')
, expires: attr('timestamp')
, server: belongsTo('server')
, isExpiring: Ember.computed('expires', function () {
    return this.get('expires').getTime() !== 0
  })
, meta: attr()
})
