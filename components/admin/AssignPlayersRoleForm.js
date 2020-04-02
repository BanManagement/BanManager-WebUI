import React, { useEffect, useState } from 'react'
import { Form, Grid, Select } from 'semantic-ui-react'
import PlayerSelector from './PlayerSelector'
import ErrorMessages from '../ErrorMessages'
import { useApi } from '../../utils'

export default function AssignPlayersRoleForm ({ query, roles, servers = [] }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [inputState, setInputState] = useState({
    players: [],
    serverId: servers.length ? servers[0].id : ''
  })

  useEffect(() => setVariables(inputState), [inputState])

  const { data, load, errors } = useApi({ query, variables }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) {
      setLoading(false)
    }
  }, [data])

  const handlePlayerChange = (value) => {
    setInputState({ ...inputState, players: value })
  }
  const handleChange = (e, { name, value }) => setInputState({ ...inputState, [name]: value })
  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    load()
  }

  const serversDropdown = servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
  const rolesDropdown = roles.map(role => ({ key: role.id, text: role.name, value: role.id }))

  return (
    <Grid doubling>
      <Grid.Row>
        <Grid.Column desktop={4} mobile={16}>
          <ErrorMessages { ...errors } />
          <PlayerSelector handleChange={handlePlayerChange} />
        </Grid.Column>
        <Grid.Column desktop={4} mobile={16}>
          <Form.Field
            required
            name='role'
            control={Select}
            options={rolesDropdown}
            placeholder='Role'
            onChange={handleChange}
            fluid
          />
        </Grid.Column>
        {!!servers.length &&
          <Grid.Column desktop={4} mobile={16}>
            <Form.Field
              required
              name='serverId'
              control={Select}
              options={serversDropdown}
              placeholder='Server'
              onChange={handleChange}
              defaultValue={serversDropdown.length ? serversDropdown[0].value : null}
              fluid
            />
          </Grid.Column>}
        <Grid.Column desktop={2} mobile={6}>
          <Form.Button
            loading={loading}
            disabled={loading}
            fluid
            primary
            size='large'
            content='Add'
            onClick={onSubmit}
          />
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}
