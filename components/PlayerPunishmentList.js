import { Card, Loader } from 'semantic-ui-react'
import PlayerPunishment from './PlayerPunishment'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

const types = ['bans', 'kicks', 'mutes', 'notes', 'warnings']

export default function PlayerPunishmentList ({ id }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(id: $id) {
        servers {
          server {
            id
            name
          }
          bans {
            id
            reason
            created
            expires
            actor {
              id
              name
            }
            acl {
              update
              delete
              yours
            }
          }
          mutes {
            id
            reason
            created
            expires
            actor {
              id
              name
            }
            acl {
              update
              delete
              yours
            }
          }
          warnings {
            id
            reason
            created
            expires
            actor {
              id
              name
            }
            acl {
              update
              delete
              yours
            }
          }
          notes {
            id
            message
            created
            actor {
              id
              name
            }
            acl {
              update
              delete
              yours
            }
          }
        }
      }
    }
  `
  })

  if (loading) return <Loader active />
  if (errors) return <ErrorMessages {...errors} />
  if (!data || !data.player || !data.player.servers) return null

  let activePunishments = []

  data.player.servers.forEach((server) => {
    types.forEach((type) => {
      if (!server[type] || !Array.isArray(server[type])) return

      const items = server[type].map(punishment => <PlayerPunishment punishment={punishment} type={type} server={server.server} key={server.id + data.id + type} />)

      activePunishments = activePunishments.concat(items)
    })
  })

  return (
    <Card.Group>
      {activePunishments}
    </Card.Group>
  )
}
