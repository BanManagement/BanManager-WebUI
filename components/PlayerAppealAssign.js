import { useEffect } from 'react'
import { Loader } from 'semantic-ui-react'
import PlayerSelector from './admin/PlayerSelector'
import { useMutateApi } from '../utils'

export default function PlayerAppealAssign ({ id, player, onChange }) {
  const { data, loading, load } = useMutateApi({
    query: /* GraphQL */ `
      mutation assignAppeal($id: ID!,$player: UUID!) {
        assignAppeal(id: $id, player: $player) {
          updated
          state {
            id
            name
          }
          assignee {
            id
            name
          }
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].updated)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (newPlayer) => {
    if (newPlayer && player?.id !== newPlayer) {
      load({ id, player: newPlayer || null })
    }
  }

  if (loading) return <Loader active />

  const options = []

  if (player) {
    options.push({
      key: player.id,
      value: player.id,
      text: player.name,
      image: `https://crafatar.com/avatars/${player.id}?size=128&overlay=true`
    })
  }

  return (
    <PlayerSelector
      fluid={false}
      multiple={false}
      // clearable
      value={player ? player.id : null}
      options={options}
      handleChange={handleChange}
    />
  )
}
