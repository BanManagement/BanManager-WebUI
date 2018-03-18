import { Component } from 'react'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQlErrorMessage from '../GraphQLErrorMessage'

const query = gql`
  query player($id: UUID!) {
    player(id: $id) {
      id
      name
      servers {
        id
        lastSeen
        server {
          id
          name
        }
        ip
        alts {
          id
          name
        }
        bans {
          id
          reason
          created
          expires
          actor {
            id
            name
          }
          acl {
            update
            delete
            yours
          }
        }
        mutes {
          id
          reason
          created
          expires
          actor {
            id
            name
          }
          acl {
            update
            delete
          }
        }
        warnings {
          id
          reason
          created
          expires
          actor {
            id
            name
          }
          acl {
            update
            delete
          }
        }
        notes {
          id
          message
          created
          actor {
            id
            name
          }
          acl {
            update
            delete
          }
        }
        acl {
          bans {
            create
          }
          mutes {
            create
          }
          notes {
            create
          }
          warnings {
            create
          }
        }
      }
    }
  }
`

class PlayerPunishmentsQuery extends Component {
  render() {
    if (this.props.data && this.props.data.error) return <GraphQlErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.player) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query, {
  options: ({ id }) => ({ variables: { id } })
})(PlayerPunishmentsQuery)
