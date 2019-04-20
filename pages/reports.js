import React from 'react'
import withData from 'lib/withData'
import withSession from 'lib/withSession'
import DefaultLayout from 'components/DefaultLayout'
import MyReports from 'components/MyReports'
import AssignedReports from 'components/AssignedReports'
import PageContentContainer from 'components/PageContentContainer'
import ReportsTable from 'components/ReportsTable'

export class ReportsPage extends React.Component {
  render () {
    const { session } = this.props

    return (
      <DefaultLayout title='Reports'>
        <PageContentContainer>
          {session.exists && <MyReports session={session} />}
          {session.exists && <AssignedReports session={session} />}
          <ReportsTable />
        </PageContentContainer>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(ReportsPage))
