import Model from 'ember-data/model'
import attr from 'ember-data/attr'
import { hasMany } from 'ember-data/relationships'

export default Model.extend(
{ name: attr('string')
, ip: attr('string')
, lastSeen: attr('timestamp')
, servers: hasMany('server')
, bans: hasMany('player-ban', { inverse: null })
, banRecords: hasMany('player-ban-record', { inverse: null })
, mutes: hasMany('player-mute', { inverse: null })
, muteRecords: hasMany('player-mute-record', { inverse: null })
, warnings: hasMany('player-warning', { inverse: null })
})
