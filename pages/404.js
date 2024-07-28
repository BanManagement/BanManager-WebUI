import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import Link from 'next/link'
import Image from 'next/image'

function Error () {
  return (
    <DefaultLayout title='Not Found'>
      <PageContainer>
        <div className='flex flex-col-reverse md:flex-row items-center justify-center gap-10'>
          <div>
            <Image src={(process.env.BASE_PATH || '') + '/images/error.png'} alt='Error' width='318' height='318' />
          </div>
          <Panel className='md:border-0'>
            <PageHeader subTitle='An error occurred' title='Oops! Page Not Found' />
            <div className='flex flex-col gap-4'>
              <p>Looks like you&apos;ve taken a wrong turn! This page must be hiding.</p>
              <h3 className='font-semibold'>Let&apos;s find our way back together:</h3>
              <ol className='list-disc pl-3'>
                <li>
                  <Link href='/' className='text-accent-500'>Head to the Homepage</Link> - start a new adventure!
                </li>
                <li>
                  Use the Search Bar - it&apos;s like a treasure map!
                </li>
                <li>Check the URL - maybe there&apos;s a tiny typo.</li>
              </ol>
            </div>
            <div className='mt-6 flex flex-col gap-2 italic text-gray-300'>
              <p>Whilst you&apos;re here, enjoy this joke:</p>
              <p><strong>Why don&apos;t Minecraft players ever get lost?</strong></p>
              <p>Because they always know their coordinates!</p>
            </div>
          </Panel>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Error
