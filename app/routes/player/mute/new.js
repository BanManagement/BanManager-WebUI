import Ember from 'ember'
import AuthenticatedRouteMixin from 'ember-simple-auth/mixins/authenticated-route-mixin'

const { inject: { service }, Route } = Ember

export default Route.extend(AuthenticatedRouteMixin,
{ sessionAccount: service('session-account')
, session: service('session')
, model() {
    return this.store.createRecord('player-mute',
      { player_id: this.modelFor('player').get('id')
      , created: new Date()
      , updated: new Date()
      })
  }
, setupController: function (controller, model) {
    this._super(controller, model)

    controller.set('title', 'Mute ' + this.modelFor('player').get('name'))
    controller.set('buttonText', 'Mute')
    controller.set('servers', this.store.findAll('server'))
  }
, renderTemplate() {
    this.render('player.ban.form', { into: 'application' })
  }
, actions:
  { save(punishment) {
      this.store.findRecord('player', this.get('session.data.authenticated.player_id'))
        .then((actor) => {
          punishment.set('actor', actor)

          return punishment.save()
        })
        .then(() => this.controller.transitionToRoute('player', punishment.get('player_id')))
        .catch(() => {})
    }
  , willTransition() {
      var model = this.controller.get('model')

      if (model.get('isNew')) model.destroyRecord()
    }
  }
})
