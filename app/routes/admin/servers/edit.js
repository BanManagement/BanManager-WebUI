import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

export default Ember.Route.extend(AuthenticatedRouteMixin,
{ model(params) {
    return this.store.findRecord('server', params.id)
  }
, renderTemplate() {
    this.render('admin.servers.edit', { outlet: 'admin' })
  }
})
