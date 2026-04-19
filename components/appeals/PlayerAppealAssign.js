import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Loader from '../Loader'
import PlayerSelector from '../admin/PlayerSelector'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerAppealAssign ({ id, player, onChange }) {
  const t = useTranslations('forms')
  const { data, loading, load, errors } = useMutateApi({
    query: /* GraphQL */ `
      mutation assignAppeal($id: ID!,$player: UUID!) {
        assignAppeal(id: $id, player: $player) {
          appeal {
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
          comment {
            id
            type
            content
            created
            actor {
              id
              name
            }
            assignee {
              id
              name
            }
            state {
              id
              name
            }
            acl {
              delete
            }
          }
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key]?.appeal?.updated)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (newPlayer) => {
    if (newPlayer && player?.id !== newPlayer) {
      load({ id, player: newPlayer || null })
    }
  }

  if (loading) return <Loader />

  return (
    <>
      <ErrorMessages errors={errors} />
      <PlayerSelector
        key={player?.id}
        multiple={false}
        onChange={handleChange}
        placeholder={t('playerSelectorPlaceholder')}
        defaultValue={player ? ({ value: player.id, label: <PlayerSelector.Label player={player} /> }) : null}
      />
    </>
  )
}
