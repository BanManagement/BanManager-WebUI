import { useEffect, useState } from 'react';
import { Form, Select } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

export default function PlayerLoginPinForm () {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inputState, setInputState] = useState({
    serverId: '',
    name: '',
    pin: ''
  })

  useEffect(() => setLoading(false), [error])

  const { data, errors } = useApi({
    query: `query servers {
    servers {
      id
      name
    }
  }`
  })

  if (errors || !data) return <ErrorMessages {...errors} />

  const servers = data.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
  const onSubmit = async (e) => {
    e.preventDefault()

    if (!inputState.serverId) inputState.serverId = servers[0].value

    setLoading(true)

    try {
      const response = await fetch('/api/session',
        {
          method: 'POST',
          body: JSON.stringify(inputState),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      setLoading(true)

      if (response.status !== 200) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      } else {
        const responseData = await response.json()

        if (responseData.hasAccount) return window.location.replace('/')

        window.location.replace('/register')
      }
    } catch (e) {
      setError(e)
    }
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages error={error} />
      <Form.Field
        required
        name='serverId'
        control={Select}
        options={servers}
        placeholder='Server'
        onChange={handleChange}
        defaultValue={servers.length ? servers[0].value : null}
      />
      <Form.Input
        required
        name='name'
        placeholder='Player name'
        icon='user'
        iconPosition='left'
        onChange={handleChange}
      />
      <Form.Input
        required
        name='pin'
        placeholder='Pin'
        type='password'
        icon='lock'
        iconPosition='left'
        onChange={handleChange}
      />
      <Form.Button fluid primary size='large' content='Join' />
    </Form>
  )
}
