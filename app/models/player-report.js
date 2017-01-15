import Ember from 'ember'
import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { belongsTo, hasMany } from 'ember-data/relationships'
const { inject: { service } } = Ember

export default Model.extend(
{ reason: attr('string')
, player: belongsTo('player')
, actor: belongsTo('player')
, assignee: belongsTo('player')
, reportCommands: hasMany('report-command')
, reportComments: hasMany('report-comment')
, reportLocations: hasMany('report-location')
, reportLogs: hasMany('report-log')
, reportState: belongsTo('report-state')
, created: attr('timestamp')
, updated: attr('timestamp')
, server: belongsTo('server')
, displayId: attr('number')
, acl: service('sl-behavior')
, sessionAccount: service('session-account')
, isExpiring: Ember.computed('expires', function () {
    return this.get('expires').getTime() !== 0
  })
, canComment: Ember.computed('reportState', 'acl.behaviors', function () {
    if (this.get('reportState.id') === '3' || this.get('reportState.id') === '4') return false

    const perms = this.get(`acl.behaviors.${this.constructor.modelName}s`)

    if (!perms) return false
    if (perms['comment.any']) return true
    if (perms['comment.own'] && this.get('actor.id') === this.get('sessionAccount.data.id')) return true
    if (perms['comment.assigned'] && this.get('assignee.id') === this.get('sessionAccount.data.id')) return true
    if (perms['comment.reported'] && this.get('player.id') === this.get('sessionAccount.data.id')) return true

    return false
  })
, meta: attr()
})
