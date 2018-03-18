import React from 'react'
import { Card, List } from 'semantic-ui-react'
import ReportsQuery from 'components/queries/ReportsQuery'
import Moment from 'react-moment'

export default class MyReports extends React.Component {
  render() {
    return (
      <Card>
        <Card.Content>
          <Card.Header>
            My Reports
          </Card.Header>
          <Card.Content>
            {this.props.session.exists &&
              <ReportsQuery player={this.props.session.id}>
                {({ reports }) => {
                  reports = reports.map(report => {
                    return (
                      <List.Item key={report.id}>
                        <List.Content>
                          <List.Header as='a' href={`/report/${report.server.id}/${report.id}`}>{report.actor.name}</List.Header>
                          <List.Description>
                            Updated <Moment unix fromNow>{report.updated}</Moment>
                          </List.Description>
                        </List.Content>
                      </List.Item>
                    )
                  })
                  return (<List divided relaxed>{reports}</List>)
                }}
              </ReportsQuery>
            }
          </Card.Content>
        </Card.Content>
      </Card>
    )
  }
}
