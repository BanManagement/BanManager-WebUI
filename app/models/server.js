import Model from 'ember-data/model'
import attr from 'ember-data/attr'

export default Model.extend(
{ name: attr('string')
, console: attr('string')
, host: attr('string')
, database: attr('string')
, user: attr('string')
, password: attr('string')
, tables: attr()
})
