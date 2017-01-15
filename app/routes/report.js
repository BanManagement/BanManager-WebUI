import Ember from 'ember'

export default Ember.Route.extend(
{ model(params) {
    return this.store.findRecord('player-report', params.id)
  }
, afterModel(model) {
    const query = { server: model.get('server.id') }

    return this.store.query('report-state', query).then((states) => {
      this.set('states', states)
    })
  }
, setupController(controller, model) {
    this._super(controller, model)

    controller.set('states', this.get('states'))
  }
})
