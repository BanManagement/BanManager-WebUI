import DefaultLayout from './DefaultLayout'
import ErrorMessages from './ErrorMessages'
import PageContainer from './PageContainer'

export default function ErrorLayout ({ errors }) {
  return (
    <DefaultLayout title='Error'>
      <PageContainer>
        <ErrorMessages errors={errors} />
      </PageContainer>
    </DefaultLayout>
  )
}
