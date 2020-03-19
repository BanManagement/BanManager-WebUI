import { Container, Header, Segment } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../components/DefaultLayout'
import PlayerSelector from '../components/admin/PlayerSelector'

export default function Page () {
  const router = useRouter()

  return (
    <DefaultLayout title='Welcome'>
      <Segment
        inverted
        color='blue'
        textAlign='center'
        style={{ padding: '1em 0em', marginLeft: '-1em', marginRight: '-1em', display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
        vertical
      >
        <Container>
          <Header
            as='h1'
            content='Your Server Name'
            inverted
            style={{ fontSize: '4em', fontWeight: 'normal', marginBottom: 0, marginTop: '3em' }}
          />
          <PlayerSelector
            multiple={false}
            handleChange={(id) => id ? router.push(`/player/${id}`) : undefined}
          />
        </Container>
      </Segment>
    </DefaultLayout>
  )
}
