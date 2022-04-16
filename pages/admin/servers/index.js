import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import Button from '../../../components/Button'
import ServerItem from '../../../components/admin/ServerItem'
import { useApi } from '../../../utils'
import PageHeader from '../../../components/PageHeader'

export default function Page () {
  const { loading, data, errors, mutate } = useApi({
    query: `query servers {
      servers {
        id
        name
      }
    }`
  })
  const onDeleted = ({ deleteServer }) => {
    const servers = data.servers.filter(s => s.id !== deleteServer)

    mutate({ ...data, servers }, false)
  }

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const canDelete = data.servers.length !== 1
  const items = data.servers.map(server => <ServerItem key={server.id} server={server} canDelete={canDelete} onDeleted={onDeleted} />)

  return (
    <AdminLayout title='Servers'>
      <PageHeader title='Servers' />
      <div className='w-24 mb-5'>
        <Link href='/admin/servers/add' passHref>
          <a>
            <Button className='bg-emerald-600 hover:bg-emerald-700'><AiOutlinePlus className='text-xl' /> Add</Button>
          </a>
        </Link>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
        {items}
      </div>
    </AdminLayout>
  )
}
