import Ember from 'ember'
import DS from 'ember-data'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'
const { inject: { service } } = Ember

export default DS.Model.extend(
{ actor: belongsTo('player')
, report: belongsTo('player-report')
, comment: attr('string')
, created: attr('timestamp')
, updated: attr('timestamp')
, acl: service('sl-behavior')
, sessionAccount: service('session-account')
, canDelete: Ember.computed('acl.behaviors', function () {
    const perms = this.get('acl.behaviors.player-reports')

    if (!perms) return false
    if (perms['comment.delete.any']) return true
    if (perms['comment.delete.own'] && this.get('actor.id') === this.get('sessionAccount.data.id')) return true

    return false
  })
})
