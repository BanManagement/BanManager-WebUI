import Transform from 'ember-data/transform'
import moment from 'moment'

export default Transform.extend(
{ deserialize(serialized) {
    return new Date(serialized * 1000)
  }

, serialize(deserialized) {
    if (!deserialized) return 0
    if (moment.isMoment(deserialized)) return deserialized.unix()

    return Math.floor(deserialized.getTime() / 1000)
  }
})
