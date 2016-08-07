import Ember from 'ember'

export function avatar(params) {
  var uuid = Ember.Handlebars.Utils.escapeExpression(params[0])
    , size = Ember.Handlebars.Utils.escapeExpression(params[1]) || 100

  return Ember.String.htmlSafe(`<img src="https://crafatar.com/avatars/${uuid}?size=${size}&overlay=true" />`)
}

export default Ember.Helper.helper(avatar)
