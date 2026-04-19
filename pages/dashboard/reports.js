import { useTranslations } from 'next-intl'
import PlayerReports from '../../components/dashboard/PlayerReports'
import DefaultLayout from '../../components/DefaultLayout'
import Loader from '../../components/Loader'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import { useUser } from '../../utils'

export default function Page () {
  const t = useTranslations()
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  if (!user) return <Loader />

  return (
    <DefaultLayout title={t('pages.dashboard.reportsDocumentTitle')}>
      <PageContainer>
        <PageHeader title={t('pages.dashboard.title')} />
        <PlayerReports title={t('pages.dashboard.reports')} />
      </PageContainer>
    </DefaultLayout>
  )
}
