import Ember from 'ember'
const { inject: { service } } = Ember

export default Ember.Controller.extend(
{ sessionAccount: service('session-account')
, commentErrors: null
, actions:
  { addComment: function (comment) {
      const model = this.store.createRecord('report-comment',
          { 'report': this.get('model')
          , comment: comment
          })

      model
        .save()
        .then(() => {
          if (model.get('isNew')) return model.destroyRecord()

          // Remove comment input text
        })
        .catch((error) => {
          model.destroyRecord()
          console.log(error.errors[0])
          this.set('commentErrors', error.errors)
        })
    }
  , deleteCommentConfirmed(model) {
      this.set('isDeleting', null)

      model.destroyRecord()
    }
  , deleteCommentConfirm(model) {
      this.set('isDeleting', model)
    }
  }
})
