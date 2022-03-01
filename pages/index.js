import DefaultLayout from '../components/DefaultLayout'
import AppealPanel from '../components/home/AppealPanel'
import SearchPanel from '../components/home/SearchPanel'
import AccountPanel from '../components/home/AccountPanel'
import StatisticsPanel from '../components/home/StatisticsPanel'
import PageContainer from '../components/PageContainer'

// const availableComponents = {
//   AccountPanel, AppealPanel, SearchPanel, StatisticsPanel, HTML
// }

export default function Page () {
  return (
    <DefaultLayout title='Welcome'>
      <PageContainer>
        <div className='flex flex-wrap -m-4'>
          <div className='p-4 lg:w-1/3'>
            <AppealPanel />
          </div>
          <div className='p-4 lg:w-1/3'>
            <SearchPanel />
          </div>
          <div className='p-4 lg:w-1/3'>
            <AccountPanel />
          </div>
        </div>
        <StatisticsPanel />
      </PageContainer>
    </DefaultLayout>
  )
}
