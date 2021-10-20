import { useEffect, useState } from 'react'
import { Form, Image, Label } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useMutateApi } from '../utils'

export default function PlayerAppealForm ({ actor, reason, expires, created, server, onFinished, parseVariables }) {
  const [inputState, setInputState] = useState({
    reason: ''
  })

  const { load, loading, data, errors } = useMutateApi({
    query: `
    mutation createAppeal($input: CreateAppealInput!) {
      createAppeal(input: $input) {
        id
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished()
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()

    load(parseVariables(inputState))
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages errors={errors} />
      <Form.Group inline>
        <label>By</label>
        <Image inline src={`https://crafatar.com/avatars/${actor.id}?size=50&overlay=true`} />
        <a href={`/player/${actor.id}`}>{actor.name}</a>
      </Form.Group>
      <Form.Group inline>
        <label>Server</label>
        {server.name}
      </Form.Group>
      <Form.Group inline>
        <label>Created</label>
        {fromNow(created)}
      </Form.Group>
      <Form.Group inline>
        <label>Expires</label>
        {expires === 0
          ? <Label style={{ float: 'right' }} color='red' horizontal>Never</Label>
          : <Label style={{ float: 'right' }} color='yellow' horizontal>{fromNow(expires)}</Label>}
      </Form.Group>
      <Form.Group inline>
        <label>Reason</label>
        {reason}
      </Form.Group>
      <Form.TextArea
        required
        label='Why should this punishment be removed?'
        name='reason'
        placeholder='Reason'
        onChange={async (e) => {
          setInputState({ ...inputState, reason: e.target.value })
        }}
        value={inputState.reason}
      />
      <Form.Button fluid primary size='large' content='Appeal' />
    </Form>
  )
}
