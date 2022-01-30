import DefaultLayout from '../components/DefaultLayout'
import PageLayout from '../components/PageLayout'
import HTML from '../components/HTML'
import AppealPanel from '../components/home/AppealPanel'
import SearchPanel from '../components/home/SearchPanel'
import AccountPanel from '../components/home/AccountPanel'
import StatisticsPanel from '../components/home/StatisticsPanel'

const availableComponents = {
  AccountPanel, AppealPanel, SearchPanel, StatisticsPanel, HTML
}

export default function Page () {
  return (
    <DefaultLayout title='Welcome'>
      <PageLayout
        availableComponents={availableComponents}
        pathname='home'
      />
    </DefaultLayout>
  )
}
