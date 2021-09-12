import { Header, Message, Segment, Loader } from 'semantic-ui-react'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerLoginPasswordForm from '../components/PlayerLoginPasswordForm'
import PlayerLoginPinForm from '../components/PlayerLoginPinForm'
import { useUser } from '../utils'

function Page () {
  const { user } = useUser({ redirectIfFound: true, redirectTo: '/' })

  if (user) return <DefaultLayout><Loader active inline='centered' /></DefaultLayout>

  return (
    <DefaultLayout title='Login'>
      <PageContainer>
        <Header>Have an account?</Header>
        <Segment>
          <PlayerLoginPasswordForm />
        </Segment>

        <Message
          info
          header='Banned?'
          content='Attempt to join the server in Minecraft, type in the pin number contained within your ban message'
        />
        <Message
          info
          header='Forgot password?'
          content='Join the server in Minecraft, type /bmpin in chat and type the generated pin number below'
        />
        <Segment>
          <PlayerLoginPinForm />
        </Segment>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
