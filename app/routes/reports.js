import Ember from 'ember'
const { inject: { service } } = Ember

export default Ember.Route.extend(
{ acl: service('sl-behavior')
, model() {
    return this.store.findAll('server')
  }
, queryParams:
  { page: { refreshModel: true }
  , size: { refreshModel: true }
  }
})
