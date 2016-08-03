import Ember from 'ember'

const { inject: { service }, Route } = Ember

export default Ember.Controller.extend(
{ sessionAccount: service('session-account')
, session: service('session')
, actions:
  { logout() {
      this.get('session').invalidate()
    }
  }
})
