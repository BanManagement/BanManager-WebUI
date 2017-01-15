import PunishmentModel from './punishment'
import attr from 'ember-data/attr'

export default PunishmentModel.extend(
{ read: attr('boolean')
, points: attr('number')
})
