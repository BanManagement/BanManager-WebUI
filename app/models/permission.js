import Ember from 'ember'
import Model from 'ember-data/model'
import attr from 'ember-data/attr'

export default Model.extend(
{ name: attr('string')
, displayName: Ember.computed('name', function () {
    return this.get('name').split('.').map((name) => Ember.String.capitalize(name)).join(' ')
  })
, formName: Ember.computed('name', 'value', function () {
    return `${this.get('name')}_${this.get('value')}`
  })
, value: attr('number')
})
