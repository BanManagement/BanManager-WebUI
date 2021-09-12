import { useState } from 'react'
import { Form, Loader, Select } from 'semantic-ui-react'
import { useApi } from '../../../utils'
import ErrorMessages from '../../ErrorMessages'

export default function RecentServerPunishmentsForm ({ meta, setMeta }) {
  const [input, setInput] = useState({ ...meta })

  const { loading, data, errors } = useApi({
    query: `query servers {
    servers {
      id
      name
    }
  }`
  })

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorMessages {...errors} />

  const handleChange = (e, { name, value }) => setInput({ ...input, [name]: value })
  const onSubmit = (e) => {
    e.preventDefault()

    setMeta({ ...input })
  }

  const servers = data.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
  const types = ['bans', 'mutes', 'reports', 'warnings'].map((value) => ({ key: value, value, text: value }))

  return (
    <Form size='large' error onSubmit={onSubmit}>
      <Form.Field
        required
        name='serverId'
        control={Select}
        options={servers}
        placeholder='Server'
        onChange={handleChange}
        defaultValue={input.serverId}
      />
      <Form.Field
        required
        name='type'
        control={Select}
        options={types}
        placeholder='Type'
        onChange={handleChange}
        defaultValue={input.type}
      />
      <Form.Button primary>Save</Form.Button>
    </Form>
  )
}
