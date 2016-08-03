import Ember from 'ember'
import config from '../config/environment'

const { inject: { service } } = Ember

export default Ember.Controller.extend(
{ sessionAccount: service('session-account')
, session: service('session')
, ajax: service('ajax')
, isDeleting: null
, actions:
  { punish(type, model) {
      if (model) {
        this.transitionToRoute(`player.${type}.edit`, { id: model.get('player_id'), punishmentId: model.get('id') })
      } else {
        this.transitionToRoute(`player.${type}.new`)
      }
    }
  , deleteConfirmed(model, reason) {
      this.set('isDeleting', null)

      var type = model.constructor.modelName
        , url = `${config.apiUrl}/v1/${type}s/${model.get('id')}?reason=${reason}`

      this.get('session').authorize('authorizer:jwt', (headerName, headerValue) => {
        var headers = {}

        headers[headerName] = headerValue

        this.get('ajax')
          .del(url, { headers: headers })
          .then((result) => this.store.findRecord(result.meta.type, result.meta.id))
          .then(() => model.deleteRecord())
          .catch((err) => console.error(err))
      })
    }
  , deleteConfirm(model, hasReason) {
      this.set('isDeleting', model)
      model.set('hasReason', hasReason)
    }
  , deleteCancelled() {
      this.set('isDeleting', null)
    }
  }
})
