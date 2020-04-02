import { Button, List, Loader } from 'semantic-ui-react'
import ErrorMessages from '../../../components/ErrorMessages'
import AdminLayout from '../../../components/AdminLayout'
import ServerItem from '../../../components/admin/ServerItem'
import { useApi } from '../../../utils'

export default function Page () {
  const { loading, data, errors } = useApi({
    query: `query servers {
      servers {
        id
        name
      }
    }`
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorMessages {...errors} />

  const canDelete = data.servers.length !== 1
  const items = data.servers.map(server => <ServerItem key={server.id} server={server} canDelete={canDelete} />)

  return (
    <AdminLayout title='Servers'>
      <Button.Group size='medium' widths='1'>
        <Button circular icon='plus' color='green' as='a' href='/admin/servers/add' />
      </Button.Group>
      <List celled verticalAlign='bottom'>
        {items}
      </List>
    </AdminLayout>
  )
}
