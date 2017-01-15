import Ember from 'ember'

export default Ember.Component.extend(
{ comment: null
, actions:
  { save() {
      const comment = this.get('comment')

      if (!comment) return

      this.set('errors', null)
      this.sendAction('action', comment)
    }
  }
})
