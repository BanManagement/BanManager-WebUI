const ExposedError = require('../../../data/exposed-error')

module.exports = async function playerActivity (obj, { serverId, actor, limit, createdStart, createdEnd, types }, { state: { loaders, serversPool } }, info) {
  if (!serversPool.has(serverId)) throw new ExposedError('Server does not exist')
  if (limit > 100) throw new ExposedError('Limit too large')
  if (createdStart && createdEnd && createdStart > createdEnd) throw new ExposedError('Start must be before end')
  if (!types.length) throw new ExposedError('Missing types')

  const filter = (query) => {
    if (actor) query.where('actor_id', actor)
    if (createdStart) query.where('created', '>=', createdStart)
    if (createdEnd) query.where('created', '<=', createdEnd)

    query
      .orderBy('id', 'DESC')
      .limit(limit)

    return query
  }
  const pastFilter = (query) => {
    if (actor) query.where('actor_id', actor)
    if (createdStart) query.where('pastCreated', '>=', createdStart)
    if (createdEnd) query.where('pastCreated', '<=', createdEnd)

    query
      .orderBy('id', 'DESC')
      .limit(limit)

    return query
  }

  const { config, pool } = serversPool.get(serverId)
  const banQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'BAN\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.playerBans))
  }
  const pastBanQuery = () => {
    return pastFilter(pool
      .select('id', pool.raw('\'BAN\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), pool.raw('pastCreated AS created'), pool.raw('\'\' AS player2'), 'reason', 'expired')
      .from(config.tables.playerBanRecords))
  }
  const unbanQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'UNBAN\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), pool.raw('createdReason AS reason'), 'expired')
      .from(config.tables.playerBanRecords))
  }
  const muteQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'MUTE\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.playerMutes))
  }
  const pastMuteQuery = () => {
    return pastFilter(pool
      .select('id', pool.raw('\'MUTE\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), pool.raw('pastCreated AS created'), pool.raw('\'\' AS player2'), 'reason', 'expired')
      .from(config.tables.playerMuteRecords))
  }
  const unmuteQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'UNMUTE\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), pool.raw('createdReason AS reason'), 'expired')
      .from(config.tables.playerMuteRecords))
  }
  const ipMuteQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPMUTE\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.ipMutes))
  }
  const pastIpMuteQuery = () => {
    return pastFilter(pool
      .select('id', pool.raw('\'IPMUTE\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), pool.raw('pastCreated AS created'), pool.raw('\'\' AS player2'), 'reason', 'expired')
      .from(config.tables.ipMuteRecords))
  }
  const ipUnmuteQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPUNMUTE\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), pool.raw('createdReason AS reason'), 'expired')
      .from(config.tables.ipMuteRecords))
  }
  const ipBanQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPBAN\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.ipBans))
  }
  const pastIpBanQuery = () => {
    return pastFilter(pool
      .select('id', pool.raw('\'IPBAN\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), pool.raw('pastCreated AS created'), pool.raw('\'\' AS player2'), 'reason', 'expired')
      .from(config.tables.ipBanRecords))
  }
  const ipUnbanQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPUNBAN\' AS type'), pool.raw('ip AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), pool.raw('createdReason AS reason'), 'expired')
      .from(config.tables.ipBanRecords))
  }
  const ipRangeBanQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPRANGEBAN\' AS type'), pool.raw('fromIp AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('toIp AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.ipRangeBans))
  }
  const pastIpRangeBanQuery = () => {
    return pastFilter(pool
      .select('id', pool.raw('\'IPRANGEBAN\' AS type'), pool.raw('fromIp AS player'), pool.raw('actor_id AS actor'), pool.raw('pastCreated AS created'), pool.raw('toIp AS player2'), 'reason', 'expired')
      .from(config.tables.ipRangeBanRecords))
  }
  const ipRangeUnbanQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'IPRANGEUNBAN\' AS type'), pool.raw('fromIp AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('toIp AS player2'), pool.raw('createdReason AS reason'), 'expired')
      .from(config.tables.ipRangeBanRecords))
  }
  const noteQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'NOTE\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), pool.raw('message AS reason'), pool.raw('0 AS expired'))
      .from(config.tables.playerNotes))
  }
  const warningQuery = () => {
    return filter(pool
      .select('id', pool.raw('\'WARNING\' AS type'), pool.raw('player_id AS player'), pool.raw('actor_id AS actor'), 'created', pool.raw('\'\' AS player2'), 'reason', pool.raw('expires AS expired'))
      .from(config.tables.playerWarnings))
  }

  const queries = types.map(type => {
    switch (type) {
      case 'BAN':
        return [banQuery(), pastBanQuery()]
      case 'UNBAN':
        return unbanQuery()
      case 'MUTE':
        return [muteQuery(), pastMuteQuery()]
      case 'UNMUTE':
        return unmuteQuery()
      case 'IPMUTE':
        return [ipMuteQuery(), pastIpMuteQuery()]
      case 'IPUNMUTE':
        return ipUnmuteQuery()
      case 'IPBAN':
        return [ipBanQuery(), pastIpBanQuery()]
      case 'IPUNBAN':
        return ipUnbanQuery()
      case 'IPRANGEBAN':
        return [ipRangeBanQuery(), pastIpRangeBanQuery()]
      case 'IPRANGEUNBAN':
        return ipRangeUnbanQuery()
      case 'NOTE':
        return noteQuery()
      case 'WARNING':
        return warningQuery()
    }

    throw new ExposedError(`Unknown type ${type}`)
  }).flat()

  const data = await pool
    .select('id', 'type', 'player', 'actor', 'created', 'player2', 'reason', 'expired')
    .from(function () {
      this.unionAll(queries, true)
        .as('subquery')
    })
    .orderBy('created', 'DESC')
    .orderBy('id', 'DESC')
    .limit(limit)

  const records = data.map(row => {
    const result = {
      type: row.type,
      reason: row.reason,
      created: row.created,
      actor: loaders.player.load({ id: row.actor, fields: ['name'] }),
      expired: row.expired
    }

    if (row.type.includes('IP')) {
      result.fromIp = row.player
    } else {
      result.player = loaders.player.load({ id: row.player, fields: ['name'] })
    }

    if (row.type.includes('IPRANGE')) {
      result.toIp = row.player2
    }

    return result
  })

  return {
    records
  }
}
