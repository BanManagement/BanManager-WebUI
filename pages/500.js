import DefaultLayout from '../components/DefaultLayout'
import PageHeader from '../components/PageHeader'

function Error () {
  return (
    <DefaultLayout title='Error'>
      <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center'>
        <PageHeader subTitle='An error occurred' title='Oops' />
        <p>Something went wrong, please try again later</p>
      </div>
    </DefaultLayout>
  )
}

export default Error
