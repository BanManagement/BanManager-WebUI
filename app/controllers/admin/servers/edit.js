import Ember from 'ember'

export default Ember.Controller.extend(
{ actions:
  { save() {
      this.model
        .save()
        .then(() => {
          this.transitionToRoute('admin.servers')
        })
        .catch(() => {
          this.set('errors', this.model.get('errors'))
        })
    }
  }
})
