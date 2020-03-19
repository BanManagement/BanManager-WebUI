import { Grid, Label, Loader, Menu } from 'semantic-ui-react'
import DefaultLayout from './DefaultLayout'
import MenuLink from './MenuLink'
import GraphQLErrorMessage from './GraphQLErrorMessage'
import PageContainer from './PageContainer'
import { useApi } from '../utils'

export default function AdminLayout ({ children, title }) {
  const { loading, data } = useApi({
    query: `query adminNavigation {
      adminNavigation {
        left {
          id
          name
          href
          label
        }
      }
    }`
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data) return <GraphQLErrorMessage error={{ networkError: true }} />

  const items = data.adminNavigation.left.map(item => {
    if (item.label) {
      return <MenuLink key={item.name} name={item.name} href={item.href}><Label color='blue'>{item.label}</Label>{item.name}</MenuLink>
    }

    return <MenuLink key={item.name} name={item.name} href={item.href}>{item.name}</MenuLink>
  })

  return (
    <DefaultLayout title={title}>
      <PageContainer>
        <Grid columns={2}>
          <Grid.Row>
            <Grid.Column width={4}>
              <Menu vertical>
                {items}
              </Menu>
            </Grid.Column>
            <Grid.Column width={12}>
              {children}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
