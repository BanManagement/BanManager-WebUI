import Loader from '../Loader'
import PlayerPunishment from '../PlayerPunishment'
import { useApi, useUser } from '../../utils'

const query = `
query playerBans($id: UUID!) {
  playerBans(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    expires
    server {
      id
      name
    }
    acl {
      yours
    }
  }
  playerMutes(player: $id) {
    id
    actor {
      id
      name
    }
    reason
    created
    expires
    server {
      id
      name
    }
    acl {
      yours
    }
  }
}`

export default function PunishmentPicker () {
  const { user } = useUser()
  const { loading, data, errors } = useApi({ query, variables: { id: user?.id } })

  if (loading) return <Loader />
  if (errors || !data || (!data?.playerBans?.length && !data?.playerMutes?.length)) {
    return <p>No punishments found</p>
  }

  let rows = []

  if (data?.playerBans?.length) {
    rows = rows.concat(data.playerBans.map(data => ({ type: 'ban', ...data })))
  }

  if (data?.playerMutes?.length) {
    rows = rows.concat(data.playerMutes.map(data => ({ type: 'mute', ...data })))
  }

  const items = rows.map((row, i) => (
    <PlayerPunishment
      key={row.server.id + row.id + row.type}
      type={row.type}
      server={row.server}
      punishment={row}
    />
  ))

  return (
    <div>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {items}
      </div>
    </div>
  )
}
