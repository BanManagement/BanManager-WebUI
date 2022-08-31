import Image from 'next/image'
import { useApi } from '../utils'

const query = `
  query settings {
    settings {
      serverFooterName
      additionalFooterText
    }
  }`

export default function Footer () {
  const { data } = useApi({ query }, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  })
  const currentYear = new Date().getFullYear()

  return (
    <footer className='text-white bg-primary-900'>
      <div className='container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col'>
        <a className='flex title-font font-medium items-center md:justify-start justify-center'>
          <Image src={process.env.BASE_PATH + '/images/banmanager-icon.png'} width='35' height='35' />
          <span className='ml-3 text-xl text-white'>{data?.settings?.serverFooterName || 'Powered by BanManager'}</span>
        </a>
        <p className='text-sm text-gray-200 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4'>
          &copy; {currentYear}
        </p>
        <p className='text-sm text-gray-200 sm:pl-4 sm:py-2 sm:mt-0 mt-4'>
          {data?.settings?.additionalFooterText}
        </p>
      </div>
    </footer>
  )
}
