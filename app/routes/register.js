import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

const { inject: { service }, Route } = Ember

export default Route.extend(AuthenticatedRouteMixin,
{ sessionAccount: service()
, beforeModel() {
    if (this.get('sessionAccount').get('data.registered')) this.transitionToRoute('index')
  }
})
