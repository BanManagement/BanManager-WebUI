import Link from 'next/link'
import Button from '../Button'
import PageHeader from '../PageHeader'
import Panel from '../Panel'

const AppealPanel = () => {
  return (
    <Panel>
      <PageHeader title='Appeal' subTitle='Help I&apos;ve been banned' />
      <p className='flex items-center mb-6'>
        If you believe your account has been wrongfully punished, create an appeal justifying why including any relevant evidence.
      </p>
      <p className='mb-3'>There is no guarantee your appeal will be successful.</p>
      <Link href='/tutorial' passHref className='mt-auto'>
        <Button>
          Create Appeal
        </Button>
      </Link>
    </Panel>
  )
}

export default AppealPanel
