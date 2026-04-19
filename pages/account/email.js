import { useTranslations } from 'next-intl'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import ResetEmailForm from '../../components/ResetEmailForm'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'
import Panel from '../../components/Panel'

export default function Page () {
  const t = useTranslations()
  const { user } = useUser({ redirectTo: '/login' })

  return (
    <DefaultLayout title={t('pages.account.changeEmailDocumentTitle')} loading={!user}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <PageHeader title={t('pages.account.changeEmail')} subTitle={t('pages.account.subtitle')} />
          <ResetEmailForm />
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
