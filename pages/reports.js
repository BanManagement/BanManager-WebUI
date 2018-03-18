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

export class ReportsPage extends React.Component {
  render() {
    const { session } = this.props

    return (
      <DefaultLayout title='Reports'>
        <Segment
          inverted
          color='blue'
          textAlign='center'
          style={{ padding: '1em 0em', marginLeft: '-1em', marginRight: '-1em' }}
          vertical
        >
        </Segment>
        <Container style={{ marginTop: '1em' }}>
          <MyReports session={session} />
          <AssignedReports session={session} />
        </Container>
      </DefaultLayout>
    )
  }
}

export default withData(withSession(ReportsPage))
