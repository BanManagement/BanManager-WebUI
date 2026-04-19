import { useTranslations } from 'next-intl'
import ActivePunishments from '../../components/dashboard/ActivePunishments'
import PlayerAppeals from '../../components/dashboard/PlayerAppeals'
import PlayerReports from '../../components/dashboard/PlayerReports'
import DefaultLayout from '../../components/DefaultLayout'
import Loader from '../../components/Loader'
import PageContainer from '../../components/PageContainer'
import PageHeader from '../../components/PageHeader'
import PlayerStatistics from '../../components/player/PlayerStatistics'
import { useUser } from '../../utils'

export default function Page () {
  const t = useTranslations()
  const { user } = useUser({ redirectTo: '/login', redirectIfFound: false })

  if (!user) return <Loader />

  return (
    <DefaultLayout title={t('pages.dashboard.documentTitle')}>
      <PageContainer>
        <PageHeader title={t('pages.dashboard.title')} />
        <div className='space-y-10'>
          <PlayerStatistics id={user.id} />
          <div data-cy='dashboard-widget-active-punishments'>
            <h2 className='text-lg font-bold pb-4 border-b border-accent-200 leading-none' data-cy='dashboard-widget-title'>{t('pages.dashboard.activePunishments')}</h2>
            <ActivePunishments id={user.id} />
          </div>
          <div>
            <PlayerAppeals id={user.id} title={t('pages.dashboard.yourAppeals')} />
          </div>
          <div>
            <PlayerReports id={user.id} title={t('pages.dashboard.yourReports')} />
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
