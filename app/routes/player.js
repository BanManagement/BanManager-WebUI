import Ember from 'ember'
const { inject: { service } } = Ember

export default Ember.Route.extend(
{ acl: service('sl-behavior')
, model(params) {
    return this.store.findRecord('player', params.id)
  }
})
