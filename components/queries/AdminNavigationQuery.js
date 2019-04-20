import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from 'components/GraphQLErrorMessage'

const query = gql`
  query adminNavigation {
    adminNavigation {
      left {
        id
        name
        href
        label
      }
    }
    navigation {
      left {
        id
        name
        href
      }
    }
  }
`

class AdminNavigationQuery extends React.Component {
  static propTypes =
  { data: PropTypes.object.isRequired,
    children: PropTypes.func.isRequired
  }

  render () {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.adminNavigation) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query)(AdminNavigationQuery)
