import { useRouter } from 'next/router'
import { Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import ErrorLayout from '../../../components/ErrorLayout'
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
  }
  fragment ReusableComponent on ReusableDeviceComponent {
    component
    x
    y
    w
    colour
    textAlign
    meta
  }`
  const query = !pathname
    ? null
    : `query pageLayout($pathname: String!) {
    pageLayout(pathname: $pathname) {
      devices {
        mobile {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
          reusableComponents {
            ...ReusableComponent
          }
        }
        tablet {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
          reusableComponents {
            ...ReusableComponent
          }
        }
        desktop {
          components {
            ...Component
          }
          unusedComponents {
            ...Component
          }
          reusableComponents {
            ...ReusableComponent
          }
        }
      }
    }
  }
  ${fragment}`

  const { loading, data, errors } = useApi({ variables: { pathname }, query })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

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
