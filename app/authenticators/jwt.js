import Ember from 'ember'
import OAuth2PasswordGrant from 'ember-simple-auth/authenticators/oauth2-password-grant'
import config from '../config/environment'
import { jwt_decode } from 'ember-cli-jwt-decode'

export default OAuth2PasswordGrant.extend(
{ serverTokenEndpoint: config.apiUrl + '/v1/auth/login'
, authenticate: function (options) {
    return new Ember.RSVP.Promise((resolve, reject) => {
      Ember.$.ajax(
      { url: this.get('serverTokenEndpoint')
      , type: 'POST'
      , data: options
      // , contentType: 'application/jsoncharset=utf-8'
      , dataType: 'json'
      }).then(function (response) {
          Ember.run(function () {
            resolve(response)
          })
      }, function (xhr) {
          var response = xhr.responseText

          Ember.run(function () {
            reject(response)
          })
      })
    })
  }

, restore(data) {
    var token = jwt_decode(data.token)

    // Um...
    token.token = data.token

    return new Ember.RSVP.Promise((resolve, reject) => {
      var now = Math.floor(Date.now() / 1000)
        , refreshAccessTokens = this.get('refreshAccessTokens')

      if (!Ember.isEmpty(token['exp']) && token['exp'] < now) {
        // if (refreshAccessTokens) {
        //   this._refreshAccessToken(data['expires_in'], data['refresh_token']).then(resolve, reject)
        // } else {
          reject()
        // }
      } else {
        if (Ember.isEmpty(token.player_id)) {
          reject()
        } else {
          // this._scheduleAccessTokenRefresh(data['expires_in'], data['expires_at'], data['refresh_token'])
          resolve(token)
        }
      }
    })
  }

, invalidate: function () {
    console.log('invalidate...')
    return Ember.RSVP.resolve()
  }
})
