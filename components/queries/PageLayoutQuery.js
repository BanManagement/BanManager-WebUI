import React from 'react'
import PropTypes from 'prop-types'
import gql from 'graphql-tag'
import { graphql } from 'react-apollo'
import { Loader } from 'semantic-ui-react'
import GraphQLErrorMessage from '../GraphQLErrorMessage'

const query = gql`
  query pageLayout($pathname: String!) {
    pageLayout(pathname: $pathname) {
      devices {
        mobile {
          id
          component
          x
          y
          w
          colour
          textAlign
          meta
        }
        tablet {
          id
          component
          x
          y
          w
          colour
          textAlign
          meta
        }
        desktop {
          id
          component
          x
          y
          w
          colour
          textAlign
          meta
        }
      }
    }
  }
`

class PageLayoutQuery extends React.Component {
  static propTypes =
  { data: PropTypes.object.isRequired
  , children: PropTypes.func.isRequired
  , pathname: PropTypes.string.isRequired
  }

  render() {
    if (this.props.data && this.props.data.error) return <GraphQLErrorMessage error={this.props.data.error} />
    if (this.props.data && !this.props.data.pageLayout) return <Loader active />

    return this.props.children(this.props.data)
  }
}

export default graphql(query, {
  options: ({ pathname }) => {
    const id = pathname.charAt(0) === '/' ? pathname.substring(1) : pathname

    return { variables: { pathname: id } }
  }
})(PageLayoutQuery)
