import AdminLayout from '../../../../components/AdminLayout'
import PageHeader from '../../../../components/PageHeader'
import { FaDiscord } from 'react-icons/fa'
import { MdSettings } from 'react-icons/md'
import Link from 'next/link'

export default function Page () {
  return (
    <AdminLayout title='Add Webhook'>
      <PageHeader title='Add Webhook' />
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 mb-6 gap-6 justify-items-center xl:justify-items-stretch'>
        <Link href='/admin/webhooks/add/custom' className='bg-black shadow-md rounded-md overflow-hidden text-center w-60 py-3'>
          <MdSettings className='h-16 w-16 mx-auto mb-8' />
          Custom
        </Link>
        <Link href='/admin/webhooks/add/discord' className='bg-black shadow-md rounded-md overflow-hidden text-center w-60 py-3'>
          <FaDiscord className='h-16 w-16 mx-auto mb-8' />
          Discord
        </Link>
      </div>
    </AdminLayout>
  )
}
