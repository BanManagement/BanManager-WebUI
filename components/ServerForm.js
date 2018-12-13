import React from 'react'
import { safeLoad } from 'js-yaml'
import { pick } from 'lodash-es'
import {
  Form,
  Header,
  Segment,
  TextArea
} from 'semantic-ui-react'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class ServerForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })
  handleTableChange = (e, { name, value }) => {
    this.setState({ tables: { ...this.state.tables, [name]: value } })
  }

  constructor(props) {
    super(props)

    const { data: { server } } = props
    const { id, name, host, port, database, user } = server || {}
    let { tables } = server || {}

    if (tables) {
      tables = Object.assign({}, tables)
      delete tables.__typename // @TODO See if better work around to prevent __typename being sent in mutation
    }

    this.state =
    { id
    , name: name || ''
    , host: host || ''
    , port: port || 3306
    , database: database || ''
    , user: user || ''
    , console: server && server.console ? server.console.id : ''
    , tables
    , error: null
    , loading: false
    , yaml: ''
    }
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  handleYamlConfig = (e, { value }) => {
    if (!value) return

    const config = safeLoad(value)

    if (!config || typeof config === 'string' || typeof config === 'number') {
      // Ignore invalid YAML
      this.setState({ yaml: '' })
      return
    }

    // Pick only web used tables
    const tables = pick(config.databases.local.tables, this.props.data.serverTables)

    this.setState(
      { tables
      , host: config.databases.local.host
      , port: config.databases.local.port
      , database: config.databases.local.name
      , user: config.databases.local.user
      , password: config.databases.local.password
      , yaml: ''
      })
  }

  render() {
    const { name, console, host, port, database, user, password, tables, error, loading, yaml } = this.state
    const { data: { serverTables } } = this.props
    let tableInputs = []

    if (serverTables) {
      tableInputs = serverTables.map(name => (
        <Form.Input
          fluid
          key={'server-table-' + name}
          required
          placeholder={name}
          value={tables ? tables[name] : null}
          name={name}
          onChange={this.handleTableChange}
        />
      ))
    }

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          <Form.Input
            fluid
            required
            placeholder='Name'
            value={name}
            name='name'
            onChange={this.handleChange}
          />
          <Form.Input
            fluid
            required
            placeholder='Console UUID (BanManager/console.yml)'
            value={console}
            name='console'
            minLength={16}
            onChange={this.handleChange}
          />
          <TextArea
            placeholder='Paste YAML BanManager/config.yml (Optional)'
            value={yaml}
            name='yaml'
            onChange={this.handleYamlConfig}
          />
          <Header>Database</Header>
          <Form.Input
            fluid
            required
            placeholder='Host'
            value={host}
            name='host'
            onChange={this.handleChange}
          />
          <Form.Input
            fluid
            required
            placeholder='Port'
            value={port}
            name='port'
            onChange={this.handleChange}
          />
          <Form.Input
            fluid
            required
            placeholder='Database Name'
            value={database}
            name='database'
            onChange={this.handleChange}
          />
          <Form.Input
            fluid
            required
            placeholder='User'
            value={user}
            name='user'
            onChange={this.handleChange}
          />
          <Form.Input
            fluid
            placeholder='Password'
            value={password}
            name='password'
            onChange={this.handleChange}
          />
          <Header>Database Table Names</Header>
          {tableInputs}
          <Form.Button fluid primary size='large' content='Save' />
        </Segment>
      </Form>
    )
  }
}

export default ServerForm
