import { Grid, Header } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import { GlobalStore } from '../../components/GlobalContext'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import AccountMenu from '../../components/AccountMenu'

export default function Page () {
  const router = useRouter()
  const store = GlobalStore()
  const user = store.get('user')

  if (!user.id) {
    router.push('/login')
    return null
  }

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
