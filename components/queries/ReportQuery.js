import React from 'react'
import gql from 'graphql-tag'
import { compose, graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from '../GraphQLErrorMessage'

const editQuery = gql`
  query report($id: ID!, $serverId: ID!) {
    reportStates(serverId: $serverId) {
      id
      name
    }
    report(id: $id, serverId: $serverId) {
      id
      player {
        id
        name
      }
      actor {
        id
        name
      }
      assignee {
        id
        name
      }
      reason
      created
      updated
      state {
        id
        name
      }
      locations {
        player {
          world
          x
          y
          z
          yaw
          pitch
          player {
            id
            name
          }
        }
        actor {
          world
          x
          y
          z
          yaw
          pitch
          player {
            id
            name
          }
        }
      }
      server {
        id
        name
      }
      acl {
        state
        assign
        comment
        delete
      }
      serverLogs {
        id
        message
        created
      }
      comments {
        id
        message
        created
        actor {
          id
          name
        }
        acl {
          delete
        }
      }
      commands {
        id
        command
        args
        created
        actor {
          id
          name
        }
      }
    }
  }
`

const createCommentMutation = gql`
  mutation createReportComment($report: ID!, $serverId: ID!, $input: ReportCommentInput!) {
    createReportComment(report: $report, serverId: $serverId, input: $input) {
      id
      created
    }
  }
`

class ReportQuery extends React.Component {
  handleCommentCreate = async (e, { message }) => {
    e.preventDefault()

    await this.props.CreateCommentMutation(
      { createCommentMutation
      , variables: { report: this.props.id, serverId: this.props.server, input: { message } }
      , refetchQueries: [ 'report' ]
      })
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.report) return <Loader active />

    return this.props.children(this.props.data
      , { handleCommentCreate: this.handleCommentCreate
        })
  }
}

export default compose(
  graphql(editQuery, { options: ({ id, server }) => ({ variables: { id, serverId: server } })})
, graphql(createCommentMutation, { name: 'CreateCommentMutation' })
)(ReportQuery)
