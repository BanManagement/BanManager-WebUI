import Ember from 'ember'

export default Ember.Component.extend(
{ authenticator: 'authenticator:jwt'
, session: Ember.inject.service('session')
, actions:
  { authenticate: function () {
      var credentials = this.getProperties('email', 'password', 'username', 'pin', 'server')

      if (credentials.pin) credentials.type = 'pin'
      if (credentials.password) credentials.type = 'password'

      this
        .get('session')
        .authenticate('authenticator:jwt', credentials)
        .catch((message) => {
          this.set('errorMessage', message)
        })
    }
  }
})
