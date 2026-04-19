import { useTranslations } from 'next-intl'
import PlayerAppeals from '../../components/dashboard/PlayerAppeals'
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
    <DefaultLayout title={t('pages.dashboard.appealsDocumentTitle')}>
      <PageContainer>
        <PageHeader title={t('pages.dashboard.title')} />
        <PlayerAppeals title={t('pages.dashboard.appeals')} showActor />
      </PageContainer>
    </DefaultLayout>
  )
}
