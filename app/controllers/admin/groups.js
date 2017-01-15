import Ember from 'ember'

export default Ember.Controller.extend(
{ actions:
  { save: function () {
      var data = this.getProperties('name', 'parent')

      var group = this.store.createRecord('group', data)

      group
        .save()
        .catch(() => {
          this.store.unloadRecord(group)
          this.set('errors', group.get('errors'))
        })
    }
  , edit: function (model) {
      this.transitionToRoute('admin.groups.edit', model.get('id'))
    }

  }
})
