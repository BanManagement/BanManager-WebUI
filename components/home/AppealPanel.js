import Link from 'next/link'
import Button from '../Button'
import PageHeader from '../PageHeader'
import Panel from '../Panel'
import { useUser } from '../../utils'

const AppealPanel = () => {
  const { user } = useUser()

  return (
    <Panel>
      <PageHeader title='Appeal' subTitle='Help I&apos;ve been banned' />
      <p className='flex mb-6'>
        If you believe your account has been wrongfully punished, create an appeal justifying why including any relevant evidence.
      </p>
      <p className='mb-3'>There is no guarantee your appeal will be successful.</p>
      <Link href={user ? '/appeal/punishment' : '/appeal'} passHref className='mt-auto'>
        <Button>
          Create Appeal
        </Button>
      </Link>
    </Panel>
  )
}

export default AppealPanel
