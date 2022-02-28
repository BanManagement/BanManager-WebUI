import Link from 'next/link'
import Button from '../Button'

const AppealPanel = () => {
  return (
    <div className='h-full p-6 flex flex-col relative text-center md:border-2 md:border-black'>
      <h2 className='text-xs tracking-widest title-font mb-5 font-medium uppercase'>Help I&apos;ve been banned</h2>
      <h1 className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none'>Appeal</h1>
      <p className='flex items-center mb-6'>
        If you believe your account has been wrongfully punished, create an appeal justifying why including any relevant evidence
      </p>
      <p className='text-xs mb-3'>There is no guarantee your appeal will be successful</p>
      <Link href='/tutorial' passHref>
        <a>
          <Button className='max-w-md mx-auto'>
            Create Appeal
          </Button>
        </a>
      </Link>
    </div>
  )
}

export default AppealPanel
