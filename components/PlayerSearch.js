import React from 'react'
import { Search } from 'semantic-ui-react'
import { withApollo } from 'react-apollo'
import { Fragment } from 'react'
import gql from 'graphql-tag'

class PlayerSearch extends React.Component {
  state = { loading: false, results: [] }

  handleSearchChange = async (e, { value }) => {
    if (value) {
      this.setState({ loading: true })

      const results = await this.props.client.query({ query, variables: { name: value, limit: 5 }})
      const data = results.data.searchPlayers.map((result) => ({
        id: result.id, title: result.name, image: `https://crafatar.com/avatars/${result.id}?size=128&overlay=true`
      }))

      this.setState({ results: data, loading: false })
    }
  }

  render() {
    return (
      <Fragment>
        <Search
          loading={this.state.loading}
          onSearchChange={this.handleSearchChange}
          onResultSelect={this.props.handleResultSelect}
          results={this.state.results}
          className={this.props.className || 'player-search'}
          placeholder='Enter player name...'
        />
        <style jsx>{`
          :global(.player-search > .results) {
            right: 0;
            margin-left: auto;
            margin-right: auto;
          }
        `}</style>
      </Fragment>
    )
  }
}

export const query = gql`
  query searchPlayers($name: String!, $limit: Int!) {
    searchPlayers(name: $name, limit: $limit) {
      id
      name
    }
  }
`
export default withApollo(PlayerSearch)
