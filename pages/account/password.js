import { Grid, Header, Loader } from 'semantic-ui-react'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import AccountMenu from '../../components/AccountMenu'
import ResetPasswordForm from '../../components/ResetPasswordForm'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  if (!user) return <DefaultLayout><Loader active inline='centered' /></DefaultLayout>

  return (
    <DefaultLayout title='Change Password'>
      <PageContainer>
        <Header>Change Password</Header>
        <Grid columns={2} stackable>
          <Grid.Row>
            <Grid.Column width={4}>
              <AccountMenu user={user} />
            </Grid.Column>
            <Grid.Column width={12}>
              <ResetPasswordForm showCurrentPassword={user.type === 'password'} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
