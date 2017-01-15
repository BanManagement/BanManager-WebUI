import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

export default Ember.Route.extend(AuthenticatedRouteMixin,
{ model(params) {
    return this.store.findRecord('group', params.id)
  }
, setupController: function (controller, model) {
    this._super(controller, model)

    controller.set('groups', this.store.findAll('group'))
    controller.set('resources', this.store.findAll('resource'))
  }
, renderTemplate() {
    this.render('admin.groups.edit', { outlet: 'admin' })
  }
})
