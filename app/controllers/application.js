import Ember from 'ember'

const { inject: { service } } = Ember

export default Ember.Controller.extend(
{ sessionAccount: service('session-account')
, session: service('session')
, actions:
  { logout() {
      this.get('session').invalidate()
    }
  }
})
