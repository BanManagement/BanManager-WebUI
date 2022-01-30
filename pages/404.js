import DefaultLayout from '../components/DefaultLayout'
import PageHeader from '../components/PageHeader'

function Error () {
  return (
    <DefaultLayout title='Not Found'>
      <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center'>
        <PageHeader subTitle='An error occurred' title='Not Found' />
        <p>Sorry, we couldn&apos;t find this page, please go back</p>
      </div>
    </DefaultLayout>
  )
}

export default Error
