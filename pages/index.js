import DefaultLayout from '../components/DefaultLayout'
import PageLayout from '../components/PageLayout'
import SearchBox from '../components/SearchBox'
import RecentServerPunishments from '../components/RecentServerPunishments'
import ServerNameHeader from '../components/ServerNameHeader'
import HTML from '../components/HTML'

const availableComponents = {
  SearchBox, RecentServerPunishments, ServerNameHeader, HTML
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
