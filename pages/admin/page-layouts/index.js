import { List, Loader } from 'semantic-ui-react'
import AdminLayout from '../../../components/AdminLayout'
import { useApi } from '../../../utils'
import ErrorLayout from '../../../components/ErrorLayout'

export default function Page () {
  const { loading, data, errors } = useApi({
    query: `query {
      pageLayouts {
        pathname
      }
    }`
  }, {
    loadOnMount: true,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: false
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data.pageLayouts.map(layout => (
    <List.Item as='a' key={layout.pathname} href={`/admin/page-layouts/${layout.pathname}`}>
      {layout.pathname}
    </List.Item>
  ))

  return (
    <AdminLayout title='Page Layouts'>
      <List celled verticalAlign='bottom' size='large'>
        {items}
      </List>
    </AdminLayout>
  )
}
