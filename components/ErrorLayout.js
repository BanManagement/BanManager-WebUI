import DefaultLayout from './DefaultLayout'
import ErrorMessages from './ErrorMessages'
import PageContainer from './PageContainer'
import PageHeader from './PageHeader'
import Panel from './Panel'

export default function ErrorLayout ({ errors }) {
  return (
    <DefaultLayout title='Error'>
      <PageContainer>
        <Panel>
          <PageHeader subTitle='Error' title='Something went wrong' />
          <ErrorMessages errors={errors} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
