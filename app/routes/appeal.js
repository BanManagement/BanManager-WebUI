import Ember from 'ember'

const { inject: { service }, Route } = Ember

export default Route.extend(
{ sessionAccount: service('session-account')
, model() {
    return this.store.findRecord('player', this.get('sessionAccount.data.id'))
  }
, afterModel() {
  }
})
