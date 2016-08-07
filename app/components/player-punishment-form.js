import Ember from 'ember'
import moment from 'moment'
import config from '../config/environment'

export default Ember.Component.extend(
{ ajax: Ember.inject.service()
, type: 'Permanent'
, serverTime: 'Pick a server'
, typeClass: 'btn-danger'
, minDate: Ember.computed(function () {
    return new Date()
  })
, didReceiveAttrs() {
    this._super(...arguments)

    if (this.get('item.expires.getTime') && this.get('item.expires').getTime() !== 0) this.send('expiresToggle')
  }
, didRender() {
    this._super(...arguments)

    if (this.get('item.expires.getTime') && this.get('item.expires').getTime() !== 0) {
      this.$('#timeExpires').collapse('show')
    }
  }
, actions:
  { save(param) {
      if (this.get('item.expires') === undefined) this.set('item.expires', 0)

      this.sendAction('action', param)
    }
  , expiresToggle() {
      var type = this.get('type')

      if (type === 'Permanent') {
        this.set('type', 'Temporary')
        this.set('typeClass', 'btn-warning')
        this.set('localTime', moment().format('hh:mm A'))
      } else {
        this.set('type', 'Permanent')
        this.set('typeClass', 'btn-danger')
        this.set('item.expires', 0)
      }
    }
  }
, getLocalTime: function () {
    var serverId = this.get('item.server.id')

    if (!serverId) return

    this.get('ajax').request(`${config.apiUrl}/v1/server/${serverId}/time`)
      .then((result) => this.set('serverTime', moment(Date.now() + result.offset).format('hh:mm A')))
  }.observes('item.server')
})
