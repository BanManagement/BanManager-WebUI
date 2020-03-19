import React, { useEffect, useState } from 'react'
import { Button, Form, Header, Image, Modal, Select } from 'semantic-ui-react'
import GraphQLErrorMessage from '../GraphQLErrorMessage'
import { useApi } from '../../utils'

export default function PlayerEditForm ({ open, onFinished, player, roles, servers }) {
  if (!player) return null

  const [loading, setLoading] = useState(false)
  const [inputState, setInputState] = useState({
    email: player.email || '',
    roles: player.roles.map(role => role.id),
    serverRoles: player.serverRoles
  })
  const [variables, setVariables] = useState({})
  const { load, data, graphQLErrors } = useApi({
    query: `mutation setRoles($player: ID!, $input: SetRolesInput!) {
      setRoles(player: $player, input: $input) {
        id
      }
    }`,
    variables
  }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setVariables({
    player: player.id,
    input: {
      roles: inputState.roles.map(id => ({ id })),
      serverRoles: inputState.serverRoles.map(role => ({ role: { id: role.role.id }, server: { id: role.server.id } }))
    }
  }), [inputState])
  useEffect(() => setLoading(false), [graphQLErrors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished(true)
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load()
  }
  const handleChange = (e, { name, value }) => setInputState({ ...inputState, [name]: value })
  const handleServerRoleChange = (e, { name, value }) => {
    const newRoles = roles
      .filter(role => value.includes(role.id))
      .map(role => ({ role: { id: role.id, name: role.name }, server: { id: name } }))

    setInputState({ ...inputState, serverRoles: newRoles })
  }

  const serversDropdown = servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
  const rolesDropdown = roles.map(role => ({ key: role.id, text: role.name, value: role.id }))

  return (
    <Modal
      open={open}
      onClose={onFinished}
    >
      <Header>
        <Image src={`https://crafatar.com/avatars/${player.id}?size=45&overlay=true`} fluid avatar />
        {player.name}
      </Header>
      <Modal.Content>
        <Form size='large' error loading={loading}>
          <GraphQLErrorMessage error={graphQLErrors} />
          <Form.Input
            fluid
            placeholder='Email'
            value={inputState.email}
            name='email'
            readOnly
          />
          <Header>Global Roles</Header>
          <Select
            required
            name='roles'
            options={rolesDropdown}
            value={inputState.roles}
            placeholder='Role'
            onChange={handleChange}
            fluid
            multiple
          />
          <Header>Server Roles</Header>
          {serversDropdown.map(server => {
            const value = inputState.serverRoles
              .filter(r => r.server.id === server.value)
              .map(({ role }) => role.id)

            return (
              <React.Fragment key={server.value}>
                <Header size='small'>{server.text}</Header>
                <Select
                  required
                  name={server.value}
                  options={rolesDropdown}
                  value={value}
                  placeholder='Role'
                  onChange={handleServerRoleChange}
                  fluid
                  multiple
                />
              </React.Fragment>
            )
          })}
        </Form>
      </Modal.Content>
      <Modal.Actions>
        <Button fluid primary size='large' content='Save' loading={loading} onClick={onSubmit} />
      </Modal.Actions>
    </Modal>)
}
