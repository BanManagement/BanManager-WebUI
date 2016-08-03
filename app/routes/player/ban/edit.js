import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

const { inject: { service }, Route } = Ember

export default Route.extend(AuthenticatedRouteMixin,
{ sessionAccount: service('session-account')
, session: service('session')
, model(params) {
    return this.store.findRecord('player-ban', params.punishmentId)
  }
, setupController: function (controller, model) {
    this._super(controller, model)

    controller.set('title', 'Edit Ban')
    controller.set('buttonText', 'Update')
    controller.set('servers', this.store.findAll('server'))
    controller.set('isEditing', true)
  }
, renderTemplate() {
    this.render('player.ban.form', { into: 'application' })
  }
, actions:
  { save(punishment) {
      punishment
        .save()
        .then(() => this.controller.transitionToRoute('player', punishment.get('player_id')))
        .catch(() => {})
    }
  , willTransition(transition) {
      var model = this.controller.get('model')

      if (model.get('hasDirtyAttributes')) {
        var confirmation = confirm('Your changes haven\'t saved yet. Would you like to leave this form?')

        if (confirmation) {
          model.rollbackAttributes()
        } else {
          transition.abort()
        }
      }
    }
  }
})
