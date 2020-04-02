import React, { useEffect, useState } from 'react'
import { Form, Header, TextArea } from 'semantic-ui-react'
import { safeLoad } from 'js-yaml'
import { pick } from 'lodash-es'
import ErrorMessages from '../ErrorMessages'
import { useApi } from '../../utils'

export default function ServerForm ({ onFinished, query, parseVariables, serverTables, defaults = {} }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [yamlState, setYamlState] = useState('')
  const [inputState, setInputState] = useState({
    name: defaults.name || '',
    host: defaults.host || '',
    port: defaults.port || 3306,
    database: defaults.database || '',
    user: defaults.user || '',
    console: defaults?.console?.id || '',
    tables: defaults.tables
  })

  useEffect(() => setVariables(parseVariables(inputState)), [inputState])

  const { load, data, errors } = useApi({ query, variables }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished()
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load()
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }
  const handleTableChange = (e, { name, value }) => {
    setInputState({ ...inputState, tables: { ...inputState.tables, [name]: value } })
  }
  const handleYamlConfig = async (e, { value }) => {
    if (!value) return

    const config = safeLoad(value)

    if (!config || typeof config === 'string' || typeof config === 'number') {
      // Ignore invalid YAML
      setYamlState('')
      return
    }

    // Pick only web used tables
    const tables = pick(config.databases.local.tables, serverTables)

    setInputState({
      ...inputState,
      tables,
      host: config.databases.local.host,
      port: config.databases.local.port,
      database: config.databases.local.name,
      user: config.databases.local.user,
      password: config.databases.local.password
    })
  }
  const tableInputs = serverTables.map(name => (
    <Form.Input
      fluid
      key={'server-table-' + name}
      required
      placeholder={name}
      value={inputState.tables ? inputState.tables[name] : null}
      name={name}
      onChange={handleTableChange}
    />
  ))

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages { ...errors } />
      <Form.Input
        fluid
        required
        placeholder='Name'
        value={inputState.name}
        name='name'
        onChange={handleChange}
      />
      <Form.Input
        fluid
        required
        placeholder='Console UUID (BanManager/console.yml)'
        value={inputState.console}
        name='console'
        minLength={16}
        onChange={handleChange}
      />
      <TextArea
        placeholder='Paste YAML BanManager/config.yml (Optional)'
        value={yamlState}
        name='yaml'
        onChange={handleYamlConfig}
      />
      <Header>Database</Header>
      <Form.Input
        fluid
        required
        placeholder='Host'
        value={inputState.host}
        name='host'
        onChange={handleChange}
      />
      <Form.Input
        fluid
        required
        placeholder='Port'
        value={inputState.port}
        name='port'
        onChange={handleChange}
      />
      <Form.Input
        fluid
        required
        placeholder='Database Name'
        value={inputState.database}
        name='database'
        onChange={handleChange}
      />
      <Form.Input
        fluid
        required
        placeholder='User'
        value={inputState.user}
        name='user'
        onChange={handleChange}
      />
      <Form.Input
        fluid
        placeholder='Password'
        type='password'
        value={inputState.password}
        name='password'
        onChange={handleChange}
      />
      <Header>Database Table Names</Header>
      {tableInputs}
      <Form.Button fluid primary size='large' content='Save' />
    </Form>
  )
}
