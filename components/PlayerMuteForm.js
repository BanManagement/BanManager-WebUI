import { useEffect, useState } from 'react'
import { Button, Checkbox, Form, Image, Select, Header } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import DateTimePicker from './DateTimePicker'
import { fromNow, useMutateApi } from '../utils'

export default function PlayerMuteForm ({ player, servers, onFinished, query, parseVariables, disableServers = false, defaults = {} }) {
  const [typeState, setTypeState] = useState(defaults.expires ? 'temporary' : 'permanent')
  const [inputState, setInputState] = useState({
    reason: defaults.reason || '',
    expires: defaults.expires * 1000 || 0,
    server: defaults?.server?.id,
    soft: defaults.soft || false
  })

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished()
  }, [data])

  const serversDropdown = servers.map(server => ({ key: server.id, value: server.id, text: server.name }))

  const onSubmit = (e) => {
    e.preventDefault()

    load(parseVariables(inputState))
  }
  const toggleExpiry = (e) => {
    e.preventDefault()

    let type = 'permanent'
    let expires = 0

    if (typeState === 'permanent') {
      type = 'temporary'
      expires = Date.now()
    }

    setTypeState(type)
    setInputState({ ...inputState, expires })
  }
  const onExpiryChange = expires => {
    setInputState({ ...inputState, expires: expires.getTime() })
  }
  const disablePast = current => current > new Date()
  const expiryColour = typeState === 'permanent' ? 'red' : 'yellow'
  const expiryLabel = typeState === 'permanent' ? 'Permanent' : 'Temporary'

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <Header>Mute</Header>
      <ErrorMessages errors={errors} />
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
        name='reason'
        placeholder='Reason'
        onChange={async (e, { value }) => {
          setInputState({ ...inputState, reason: value })
        }}
        value={inputState.reason}
      />
      <Form.Group inline>
        <label>Expires</label>
        <Button color={expiryColour} onClick={toggleExpiry}>{expiryLabel}</Button>
        {inputState.expires !== 0 &&
          <DateTimePicker
            value={new Date(inputState.expires)}
            isValidDate={disablePast}
            onChange={onExpiryChange}
          />}
      </Form.Group>
      <Form.Group inline>
        <Checkbox
          label='Soft' name='soft' toggle defaultChecked={defaults.soft} onChange={async (e, { checked }) => {
            setInputState({ ...inputState, soft: checked })
          }}
        />
      </Form.Group>
      {defaults.created &&
        <Form.Group inline>
          <label>Created</label>{fromNow(defaults.created)}
        </Form.Group>}
      <Form.Button fluid primary size='large' content='Save' />
    </Form>
  )
}
