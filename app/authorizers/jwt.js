import Base from 'ember-simple-auth/authorizers/base'
import Ember from 'ember'

export default Base.extend(
{ authorize(data, block) {
    const token = data.token

    if (!Ember.isEmpty(token)) {
      block('Authorization', `Bearer ${token}`)
    }
  }
})
