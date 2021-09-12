import { useEffect, useState } from 'react'
import { Form, Image, Select, Header } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useMutateApi } from '../utils'

export default function PlayerNoteForm ({ player, servers, onFinished, query, parseVariables, disableServers = false, defaults = {} }) {
  const [loading, setLoading] = useState(false)
  const [inputState, setInputState] = useState({
    message: defaults.message || '',
    server: defaults?.server?.id
  })

  const { load, data, errors } = useMutateApi({ query })

  useEffect(() => setLoading(false), [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished()
  }, [data])

  const serversDropdown = servers.map(({ server }) => ({ key: server.id, value: server.id, text: server.name }))

  const onSubmit = (e) => {
    e.preventDefault()
    setLoading(true)

    load(parseVariables(inputState))
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <Header>Note</Header>
      <ErrorMessages {...errors} />
      <Form.Group inline>
        <label>
          <Image fluid inline src={`https://crafatar.com/avatars/${player.id}?size=50&overlay=true`} />
        </label>
        <a href={`/player/${player.id}`}>{player.name}</a>
      </Form.Group>
      <Form.Field
        required
        name='server'
        control={Select}
        options={serversDropdown}
        placeholder='Server'
        onChange={async (e, { value }) => {
          setInputState({ ...inputState, server: value })
        }}
        defaultValue={inputState.server}
        disabled={disableServers}
      />
      <Form.Input
        required
        name='message'
        placeholder='Message'
        onChange={async (e, { value }) => {
          setInputState({ ...inputState, message: value })
        }}
        value={inputState.message}
      />
      {defaults.created &&
        <Form.Group inline>
          <label>Created</label>{fromNow(defaults.created)}
        </Form.Group>}
      <Form.Button fluid primary size='large' content='Save' />
    </Form>
  )
}
