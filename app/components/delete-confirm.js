import Ember from 'ember'

export default Ember.Component.extend(
{ model: false
, reason: ''
, actions:
  { deleteConfirmed() {
      this.sendAction('deleteConfirmed', this.get('model'))
    }
  , deleteCancelled() {
      this.sendAction('deleteCancelled')
    }
  }
})
