import { Header } from 'semantic-ui-react'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import ReportsTable from '../../components/ReportsTable'

export default function Page () {
  return (
    <DefaultLayout title='Reports'>
      <PageContainer>
        <Header>Reports</Header>
        <ReportsTable />
      </PageContainer>
    </DefaultLayout>
  )
}
