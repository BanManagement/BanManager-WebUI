import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import Button from '../../../components/Button'
import ServerItem from '../../../components/admin/ServerItem'
import { useApi } from '../../../utils'
import AdminHeader from '../../../components/admin/AdminHeader'

export default function Page () {
  const t = useTranslations()
  const { loading, data, errors, mutate } = useApi({
    query: `query servers {
      servers {
        id
        name
        stats {
          totalActiveBans
          totalActiveMutes
          totalReports
          totalWarnings
        }
      }
    }`
  })
  const onDeleted = ({ deleteServer }) => {
    const servers = data.servers.filter(s => s.id !== deleteServer)

    mutate({ ...data, servers }, false)
  }

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const canDelete = data.servers.length !== 1
  const items = data.servers.map(server => <ServerItem key={server.id} server={server} canDelete={canDelete} onDeleted={onDeleted} />)

  return (
    <AdminLayout title={t('pages.admin.servers.title')}>
      <AdminHeader title={t('pages.admin.servers.title')}>
        <div>
          <Link href='/admin/servers/add' passHref>

            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><AiOutlinePlus className='text-xl -ml-1 mr-2' /> {t('pages.admin.servers.addServer')}</Button>

          </Link>
        </div>
      </AdminHeader>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 justify-items-center xl:justify-items-stretch'>
        {items}
      </div>
    </AdminLayout>
  )
}
