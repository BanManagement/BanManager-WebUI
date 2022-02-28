import Loader from './Loader'
import PageHeader from './PageHeader'
import PlayerPunishment from './PlayerPunishment'
import { useApi } from '../utils'

const query = `
query playerMutes($id: UUID!) {
  playerMutes(player: $id) {
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

export default function ActivePlayerMutes ({ id, color }) {
  const { loading, data, errors, mutate } = useApi({ query, variables: { id } })

  if (loading) return <Loader />
  if (errors || !data || !data.playerMutes || !data.playerMutes.length) return null

  const rows = data.playerMutes.map((row, i) => (
    <PlayerPunishment
      key={row.server.id + row.id + 'mute'}
      type='mute'
      server={row.server}
      punishment={row}
      onDeleted={({ deletePlayerMute: { id } }) => {
        const records = data.playerMutes.filter(c => c.id !== id)

        mutate({ ...data, playerMutes: records }, false)
      }}
    />
  ))

  return (
    <div>
      <PageHeader title='Active Mutes' style={{ borderColor: `${color}` }} />
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        {rows}
      </div>
    </div>
  )
}
