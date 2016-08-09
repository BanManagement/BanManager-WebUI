import Ember from 'ember'

const { inject: { service }, Route } = Ember

export default Route.extend(
{ sessionAccount: service('session-account')
, session: service('session')
, beforeModel() {
    if (!this.get('sessionAccount').get('data.name')) return this.get('sessionAccount').loadCurrentUser()
  }
})
