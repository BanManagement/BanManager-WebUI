import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import GraphQLErrorMessage from '../../../components/GraphQLErrorMessage'
import { useApi } from '../../../utils'
import PageLayoutForm from '../../../components/admin/PageLayoutForm'

export default function Page () {
  const router = useRouter()
  const { pathname } = router.query
  const fragment = `fragment Component on DeviceComponent {
    id
    component
    x
    y
    w
    colour
    textAlign
    meta
  }`
  const query = `query pageLayout($pathname: String!) {
    pageLayout(pathname: $pathname) {
      devices {
        mobile {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
        }
        tablet {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
        }
        desktop {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
        }
      }
    }
  }
  ${fragment}`

  const { loading, data } = useApi({ variables: { pathname }, query }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data) return <GraphQLErrorMessage error={{ networkError: true }} />

  const mutationQuery = `mutation updatePageLayout($pathname: ID!, $input: UpdatePageLayoutInput!) {
    updatePageLayout(pathname: $pathname, input: $input) {
      pathname
    }
  }`

  return (
    <AdminLayout title={`Edit ${pathname} Layout`}>
      <PageLayoutForm
        query={mutationQuery}
        pathname={pathname}
        pageLayout={data.pageLayout}
        onFinished={() => router.push('/admin/page-layouts')}
      />
    </AdminLayout>
  )
}
