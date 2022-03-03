import Link from 'next/link'
import Loader from '../../../components/Loader'
import PageHeader from '../../../components/PageHeader'
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
  })

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data.pageLayouts.map(layout => (
    <div key={layout.pathname} className='bg-black shadow-md rounded-md overflow-hidden text-center w-80'>
      <Link href={`/admin/page-layouts/${layout.pathname}`} passHref>
        <a>
          <div className='p-5'>
            <h5 className='text-xl font-semibold mb-2'>{layout.pathname}</h5>
          </div>
        </a>
      </Link>
    </div>
  ))

  return (
    <AdminLayout title='Page Layouts'>
      <PageHeader title='Page Layouts' />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 justify-items-center pb-12'>
        {items}
      </div>
    </AdminLayout>
  )
}
