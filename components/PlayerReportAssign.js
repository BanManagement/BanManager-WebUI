import React from 'react'
import { Loader } from 'semantic-ui-react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'
import PlayerSelector from 'components/admin/PlayerSelector'

class PlayerReportAssign extends React.Component {
  constructor(props) {
    super(props)

    this.state = { loading: false, assignee: props.assignee }
  }

  handleChange = async (id) => {
    if (this.state.assignee && this.state.assignee.id === id) return

    this.setState({ loading: true })

    try {
      await this.props.mutate({
        variables: { serverId: this.props.server, report: this.props.id, player: id }
      })
    } catch (e) {
    }

    this.setState({ loading: false })
  }

  render() {
    const { assignee, loading } = this.state

    if (loading) return <Loader active />

    let options = null

    if (assignee) {
      options = [
        { key: assignee.id
        , value: assignee.id
        , text: assignee.name
        , image: `https://crafatar.com/avatars/${assignee.id}?size=128&overlay=true`
        } ]
    }

    return (
      <PlayerSelector
        fluid={false}
        multiple={false}
        value={assignee ? assignee.id : null }
        options={options}
        handleChange={this.handleChange}
      />
    )
  }
}

const mutation = gql`
  mutation assignReport($report: ID!, $serverId: ID!, $player: UUID!) {
    assignReport(report: $report, serverId: $serverId, player: $player) {
      updated
      state {
        id
        name
      }
    }
  }
`

export default graphql(mutation)(PlayerReportAssign)
