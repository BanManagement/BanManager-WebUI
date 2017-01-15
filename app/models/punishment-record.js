import Ember from 'ember'
import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo } from 'ember-data/relationships'
const { inject: { service } } = Ember

export default Model.extend(
{ reason: attr('string')
, createdReason: attr('string')
, actor: belongsTo('player')
, pastActor: belongsTo('player')
, created: attr('timestamp')
, pastCreated: attr('timestamp')
, expired: attr('timestamp')
, server: belongsTo('server')
, acl: service('sl-behavior')
, sessionAccount: service('session-account')
, canDelete: Ember.computed('acl.behaviors', 'actor', function () {
    const perms = this.get(`acl.behaviors.${this.constructor.modelName}s`)

    if (!perms) return false
    if (perms['delete.any']) return true
    if (perms['delete.own'] && this.get('actor.id') === this.get('sessionAccount.data.id')) return true

    return false
  })
, canUpdate: Ember.computed('acl.behaviors', 'actor', function () {
    const perms = this.get(`acl.behaviors.${this.constructor.modelName}s`)

    if (!perms) return false
    if (perms['update.any']) return true
    if (perms['update.own'] && this.get('actor.id') === this.get('sessionAccount.data.id')) return true

    return false
  })
})
