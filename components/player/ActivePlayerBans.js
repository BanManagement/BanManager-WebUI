import Loader from '../Loader'
import PlayerHeader from './PlayerHeader'
import PlayerPunishment from './PlayerPunishment'
import { useApi } from '../../utils'

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
    updated
    expires
    acl {
      update
      delete
      yours
    }
    server {
      id
      name
    }
  }
}`

export default function ActivePlayerBans ({ id }) {
  const { loading, data, mutate, errors } = useApi({ query, variables: { id } })

  if (loading) return <Loader />
  if (errors || !data || !data.playerBans || !data.playerBans.length) return null

  const rows = data.playerBans.map((row, i) => (
    <PlayerPunishment
      key={row.server.id + row.id + 'ban'}
      type='ban'
      server={row.server}
      punishment={row}
      onDeleted={({ deletePlayerBan: { id } }) => {
        const records = data.playerBans.filter(c => c.id !== id)

        mutate({ ...data, playerBans: records }, false)
      }}
    />
  ))

  return (
    <div>
      <PlayerHeader title={`Active Bans (${data.playerBans.length})`} />
      <div className='flex flex-col gap-6'>
        {rows}
      </div>
    </div>
  )
}
