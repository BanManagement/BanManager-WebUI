import Ember from 'ember'

export default Ember.Controller.extend(
{ queryParams: [ 'page', 'size' ]
, page: 1
, size: 5
, actions:
  { view: (model) => this.transitionToRoute('report', model.get('id'))
  }
})
