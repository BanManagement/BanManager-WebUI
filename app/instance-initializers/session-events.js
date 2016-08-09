export function initialize(appInstance) {
  var applicationRoute = appInstance.lookup('route:application')
    , session = appInstance.lookup('service:session')

  var sessionAccount = appInstance.lookup('service:session-account')

  session.on('authenticationSucceeded', function () {
    sessionAccount
      .loadCurrentUser()
      .then(() => {
        if (sessionAccount.get('data.registered')) {
          applicationRoute.transitionTo('index')
        } else {
          applicationRoute.transitionTo('register')
        }
      })
      .catch(() => this.get('session').invalidate())
  })

  session.on('invalidationSucceeded', function () {
    window.location.reload()
  })
}

export default
{ name: 'session-events'
, initialize
, after: 'ember-simple-auth'
}
