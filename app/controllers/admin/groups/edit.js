import Ember from 'ember'

export default Ember.Controller.extend(
{ actions:
  { chooseParent(parent) {
      console.log(parent)
    }
  , save() {
      this.model
        .save()
        .then(() => {
          this.transitionToRoute('admin.groups')
        })
        .catch(() => {
          this.set('errors', this.model.get('errors'))
        })
    }
  }
})
