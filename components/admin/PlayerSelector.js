import React from 'react'
import gql from 'graphql-tag'
import { withApollo } from 'react-apollo'
import { Dropdown } from 'semantic-ui-react'

class PlayerSelector extends React.Component {
  static defaultProps = {
    multiple: true
  , fluid: true
  , placeholder: 'Select players'
  }

  constructor(props) {
    super(props)

    let value = props.value

    if (!value) value = props.multiple ? [] : null

    this.state = { loading: false, value, options: props.options || [] }
  }

  handleChange = (e, { value }) => {
    this.setState({ value })
    this.props.handleChange(value)
  }

  handleSearchChange = async (e, { searchQuery }) => {
    if (!searchQuery) return

    this.setState({ loading: true })

    const results = await this.props.client.query({ query, variables: { name: searchQuery, limit: 5 } })
    const options = results.data.searchPlayers.map((result) => ({
      key: result.id, text: result.name, value: result.id, image: `https://crafatar.com/avatars/${result.id}?size=128&overlay=true`
    })).concat(this.state.options.filter(opt => this.state.value.indexOf(opt.value) !== -1))

    this.setState({ options, loading: false })
  }

  render() {
    const { fluid, multiple, placeholder } = this.props
    const { options, loading, value } = this.state

    return (
      <Dropdown
        fluid={fluid}
        selection
        multiple={multiple}
        search
        options={options}
        value={value}
        placeholder={placeholder}
        onChange={this.handleChange}
        onSearchChange={this.handleSearchChange}
        disabled={loading}
        loading={loading}
      />
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
export default withApollo(PlayerSelector)
