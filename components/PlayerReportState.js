import React from 'react'
import { Dropdown, Loader } from 'semantic-ui-react'
import { graphql } from 'react-apollo'
import gql from 'graphql-tag'

class PlayerReportState extends React.Component {
  constructor(props) {
    super(props)

    this.state = { loading: false, currentState: props.currentState }
  }

  handleChange = async (e, { value }) => {
    if (this.state.currentState && this.state.currentState.id === value) return

    this.setState({ loading: true })

    try {
      await this.props.mutate({
        variables: { serverId: this.props.server, report: this.props.id, state: value }
      })

      this.setState({ currentState: { id: value } })
    } catch (e) {
      console.error(e)
    }

    this.setState({ loading: false })
  }

  render() {
    const { states } = this.props
    const { currentState, loading } = this.state

    if (loading) return <Loader active />

    return (
      <Dropdown
        fluid={false}
        value={currentState.id}
        options={states}
        onChange={this.handleChange}
      />
    )
  }
}

const mutation = gql`
  mutation reportState($report: ID!, $serverId: ID!, $state: ID!) {
    reportState(report: $report, serverId: $serverId, state: $state) {
      updated
      state {
        id
        name
      }
    }
  }
`

export default graphql(mutation)(PlayerReportState)
