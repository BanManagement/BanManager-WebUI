import { Grid, Header, Loader } from 'semantic-ui-react'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import AccountMenu from '../../components/AccountMenu'
import { useUser } from '../../utils'

export default function Page () {
  const { user } = useUser({ redirectTo: '/login' })

  if (!user) return <DefaultLayout><Loader active inline='centered' /></DefaultLayout>

  return (
    <DefaultLayout title={`Settings for ${user.name}`}>
      <PageContainer>
        <Header>Settings for {user.name}</Header>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column width={4}>
              <AccountMenu user={user} />
            </Grid.Column>
            <Grid.Column width={12} />
          </Grid.Row>
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
