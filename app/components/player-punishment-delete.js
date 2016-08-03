import Ember from 'ember'

export default Ember.Component.extend(
{ model: false
, reason: ''
, actions:
  { deleteConfirmed(param) {
      this.sendAction('deleteConfirmed', this.get('model'), this.get('reason'))
    }
  , deleteCancelled() {
      this.sendAction('deleteCancelled')
    }
  }
})
