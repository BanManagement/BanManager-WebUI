import Ember from 'ember'
const fields = [ 'host', 'database', 'user', 'password' ]
    , tables =
      [ 'players'
      , 'playerBans'
      , 'playerBanRecords'
      , 'playerMutes'
      , 'playerMuteRecords'
      , 'playerKicks'
      , 'playerNotes'
      , 'playerHistory'
      , 'playerPins'
      , 'playerReports'
      , 'playerReportLocations'
      , 'playerReportStates'
      , 'playerReportCommands'
      , 'playerReportComments'
      , 'playerWarnings'
      , 'ipBans'
      , 'ipBanRecords'
      , 'ipMutes'
      , 'ipMuteRecords'
      , 'ipRangeBans'
      , 'ipRangeBanRecords'
      ]

export default Ember.Controller.extend(
{ convertYaml: function () {
    var yaml = this.get('yaml')

    if (!yaml) return

    var config = window.YAML.parse(yaml)

    if (typeof config === 'string' || !config.databases || !config.databases.local) return

    var database = config.databases.local

    // Set database name
    database.database = database.name

    fields.forEach((field) => {
      if (!this.get(field)) this.set(field, database[field])
    })

    Object.keys(database.tables).forEach((table) => {
      if (!this.get(table)) this.set(table, database.tables[table])
    })

    this.set('yaml', '')

  }.observes('yaml')
, actions:
  { save: function () {
      var data = this.getProperties('name', 'console', 'host', 'database', 'user', 'password')

      data.tables = {}

      tables.forEach((table) => {
        data.tables[table] = this.get(table)
      })

      var server = this.store.createRecord('server', data)

      server
        .save()
        .catch(() => {
          this.store.unloadRecord(server)
          this.set('errors', server.get('errors'))
        })
    }
  , edit: function (model) {
      this.transitionToRoute('admin.servers.edit', model.get('id'))
    }

  }
})
