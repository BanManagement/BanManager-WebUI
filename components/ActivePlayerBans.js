import Loader from './Loader'
import PageHeader from './PageHeader'
import PlayerPunishment from './PlayerPunishment'
import { useApi } from '../utils'

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

export default function ActivePlayerBans ({ id, color }) {
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
      <PageHeader title='Active Bans' style={{ borderColor: `${color}` }} />
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {rows}
      </div>
    </div>
  )
}
