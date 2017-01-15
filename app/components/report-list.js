import Ember from 'ember'

export default Ember.Component.extend(
{ didReceiveAttrs() {
    this._super(...arguments)

    this.getReports()
  }
, getReports: function () {
    var serverId = this.get('server.id')

    this.get('targetObject.store')
      .query('player-report', { server: serverId })
      .then((reports) => this.set('reports', reports))
  }
})
