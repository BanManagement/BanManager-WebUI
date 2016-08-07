import Ember from 'ember'
import SimpleSession from 'ember-simple-auth/services/session'

const { inject: { service }, RSVP, isEmpty } = Ember

export default SimpleSession.extend(
{ session: service('session')
, store: service()
, loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      const token = this.get('session.data.authenticated.token')

      if (!isEmpty(token)) {
        return this.get('store').find('user', 'me').then((data) => {
          this.set('data', data)

          resolve()
        }, reject)
      } else {
        resolve()
      }
    })
  }
})
