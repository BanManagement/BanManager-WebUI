import React from 'react'
import withData from 'lib/withData'
import withSession from 'lib/withSession'
import DefaultLayout from 'components/DefaultLayout'
import {
  Container,
  Segment
} from 'semantic-ui-react'
import MyReports from 'components/MyReports'
import AssignedReports from 'components/AssignedReports'
import PageContentContainer from 'components/PageContentContainer'

export class ReportsPage extends React.Component {
  render () {
    const { session } = this.props

    return (
      <DefaultLayout title='Reports'>
        <PageContentContainer>
          <MyReports session={session} />
          <AssignedReports session={session} />
        </PageContentContainer>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(ReportsPage))
