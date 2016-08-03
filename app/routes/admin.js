import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

export default Ember.Route.extend(AuthenticatedRouteMixin,
{ beforeModel() {
    if (!window.YAML) Ember.$.getScript('/assets/vendor-admin.js')
  }

})
