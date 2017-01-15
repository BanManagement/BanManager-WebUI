import Ember from 'ember'
import config from './config/environment'

const Router = Ember.Router.extend(
{ location: config.locationType
})

Router.map(function () {
  this.route('stats')
  this.route('player', { resetNamespace: true, path: '/player/:id' }, function () {
    this.route('ban.new', { path: '/ban' })
    this.route('ban.edit', { path: '/ban/:punishmentId' })

    this.route('mute.new', { path: '/mute' })
    this.route('mute.edit', { path: '/mute/:punishmentId' })

    this.route('warning.new', { path: '/warning' })
    this.route('warning.edit', { path: '/warning/:punishmentId' })
  })
  this.route('login')
  this.route('register')
  this.route('admin', { resetNamespace: true }, function () {
    this.route('servers')
    this.route('servers.edit', { path: '/server/:id' })

    this.route('groups')
    this.route('groups.edit', { path: '/group/:id' })
  })
  this.route('appeal')
  this.route('reports')
  this.route('report', { path: '/report/:id' })
})

export default Router
