import Ember from 'ember'
import config from '../config/environment'

const { inject: { service } } = Ember

export default Ember.Controller.extend(
{ session: service()
, ajax: service()
, actions:
  { register() {
      var data = this.getProperties('email', 'password')

      this.get('session').authorize('authorizer:jwt', (headerName, headerValue) => {
        var headers = {}
          , url = `${config.apiUrl}/v1/users/me`

        headers[headerName] = headerValue

        this.get('ajax')
          .put(url, { headers: headers, data: data })
          .then(() => this.transitionTo('index'))
          .catch((err) => this.set('errors', err.errors))
      })
    }
  }
})
