import { Container, Header, Image, Loader } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useApi } from '../utils'

export default function PlayerHeader ({ id, colour }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(player: $id) {
        id
        name
        lastSeen
      }
    }
  `
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorMessages errors={errors} />

  return (
    <Container text>
      <Header
        as='h1'
        icon
        inverted={!!colour}
        style={{ fontWeight: 'normal' }}
      >
        <Image src={`https://crafatar.com/avatars/${data.player.id}?size=128&overlay=true`} />
        <Header.Content>{data.player.name}</Header.Content>
        <Header.Subheader>{fromNow(data.player.lastSeen)}</Header.Subheader>
      </Header>
    </Container>
  )
}
