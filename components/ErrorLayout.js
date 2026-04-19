import { useTranslations } from 'next-intl'
import DefaultLayout from './DefaultLayout'
import ErrorMessages from './ErrorMessages'
import PageContainer from './PageContainer'
import PageHeader from './PageHeader'
import Panel from './Panel'

export default function ErrorLayout ({ errors }) {
  const t = useTranslations('errors')

  return (
    <DefaultLayout title={t('header')}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader subTitle={t('header')} title={t('somethingWentWrong')} />
          <ErrorMessages errors={errors} />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
