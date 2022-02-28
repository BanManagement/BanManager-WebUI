import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import { Wizard } from '../components/tutorial/Wizard'
import PageHeader from '../components/PageHeader'

function Page () {
  return (
    <DefaultLayout title='Tutorial'>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center'>
          <PageHeader title='Tutorial' subTitle='How to appeal a punishment' />
          <Wizard />
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
