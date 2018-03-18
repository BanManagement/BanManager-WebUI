import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import {
  Loader
} from 'semantic-ui-react'
import GraphQLErrorMessage from '../GraphQLErrorMessage'

const query = gql`
  query navigation {
    navigation {
      left {
        id
        name
        href
      }
    }
  }
`

class NavigationQuery extends React.Component {
  static propTypes =
  { data: PropTypes.object.isRequired
  , children: PropTypes.func.isRequired
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.navigation) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query)(NavigationQuery)
