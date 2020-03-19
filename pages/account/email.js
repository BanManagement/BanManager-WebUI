import { Grid, Header } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import { GlobalStore } from '../../components/GlobalContext'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import AccountMenu from '../../components/AccountMenu'
import ResetEmailForm from '../../components/ResetEmailForm'

export default function Page () {
  const router = useRouter()
  const store = GlobalStore()
  const user = store.get('user')

  if (!user.id) {
    router.push('/login')
    return null
  }

  return (
    <DefaultLayout title='Change Email'>
      <PageContainer>
        <Header>Change Email</Header>
        <Grid columns={2} stackable>
          <Grid.Row>
            <Grid.Column width={4}>
              <AccountMenu user={user} />
            </Grid.Column>
            <Grid.Column width={12}>
              <ResetEmailForm />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
