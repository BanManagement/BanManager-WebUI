import { Header } from 'semantic-ui-react'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import AppealsTable from '../../components/AppealsTable'

export default function Page () {
  return (
    <DefaultLayout title='Appeals'>
      <PageContainer>
        <Header>Appeals</Header>
        <AppealsTable />
      </PageContainer>
    </DefaultLayout>
  )
}
