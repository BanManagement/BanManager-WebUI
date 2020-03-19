import { Header, Message } from 'semantic-ui-react'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PlayerRegisterForm from '../components/PlayerRegisterForm'

export default function Page () {
  return (
    <DefaultLayout title='Register'>
      <PageContainer>
        <Header>Register an account?</Header>
        <Message>
          <Message.Header>Benefits</Message.Header>
          <Message.List>
            <Message.Item>Quicker login</Message.Item>
            <Message.Item>Push Notifications (Coming Soon)</Message.Item>
            <Message.Item>Manage multiple player accounts (Coming Soon)</Message.Item>
          </Message.List>
        </Message>
        <PlayerRegisterForm />
      </PageContainer>
    </DefaultLayout>
  )
}
