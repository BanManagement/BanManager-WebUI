import Image from 'next/image'

export default function Footer () {
  const currentYear = new Date().getFullYear()

  return (
    <footer className='text-white bg-primary-900'>
      <div className='container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col'>
        <a className='flex title-font font-medium items-center md:justify-start justify-center'>
          <Image src='/images/banmanager-icon.png' width='35' height='35' />
          <span className='ml-3 text-xl text-white'>Your Server Name</span>
        </a>
        <p className='text-sm text-gray-200 sm:ml-4 sm:pl-4 sm:border-l-2 sm:border-gray-200 sm:py-2 sm:mt-0 mt-4'>&copy; {currentYear}
        </p>
      </div>
    </footer>
  )
}
