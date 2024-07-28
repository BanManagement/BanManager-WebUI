import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import Link from 'next/link'
import Image from 'next/image'

function Error () {
  return (
    <DefaultLayout title='Error'>
      <PageContainer>
        <div className='flex flex-col-reverse md:flex-row items-center justify-center gap-10'>
          <div>
            <Image src={(process.env.BASE_PATH || '') + '/images/error.png'} alt='Error' width='318' height='318' />
          </div>
          <Panel className='md:border-0'>
            <PageHeader subTitle='Oops!' title='Something went wrong' />
            <div className='flex flex-col gap-4'>
              <p>The server is having a breakdown, but our team of creepers are on it!</p>
              <h3 className='font-semibold'>In the mean time, you can:</h3>
              <ol className='list-disc pl-3'>
                <li>
                  <Link href='/' className='text-accent-500'>Head to the Homepage</Link> - try a new adventure!
                </li>
                <li>
                  Use the Search Bar - it&apos;s like a treasure map!
                </li>
                <li>Check back later - The server might just need a little break.</li>
              </ol>
            </div>
            <div className='mt-6 flex flex-col gap-2 italic text-gray-300'>
              <p>Whilst you&apos;re here, enjoy this joke:</p>
              <p><strong>Why did the Minecraft server break?</strong></p>
              <p>Because it couldn&apos;t handle all the blocks!!</p>
            </div>
          </Panel>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Error
