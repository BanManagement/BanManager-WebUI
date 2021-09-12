import React from 'react'
import { Grid, Label, Loader, Menu } from 'semantic-ui-react'
import DefaultLayout from './DefaultLayout'
import MenuLink from './MenuLink'
import ErrorLayout from './ErrorLayout'
import PageContainer from './PageContainer'
import { useApi } from '../utils'

export default function AdminLayout ({ children, title }) {
  const { loading, data, errors } = useApi({
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
  })

  if (loading && !data) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

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
            <Grid.Column computer={4} tablet={4} mobile={16}>
              <Menu vertical fluid>
                {items}
              </Menu>
            </Grid.Column>
            <Grid.Column computer={12} tablet={12} mobile={16}>
              {children}
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </PageContainer>
    </DefaultLayout>
  )
}
