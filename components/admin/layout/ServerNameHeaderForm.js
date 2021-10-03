import { useState } from 'react'
import { Form, Loader, Select } from 'semantic-ui-react'
import { useApi } from '../../../utils'
import ErrorMessages from '../../ErrorMessages'

export default function ServerNameHeaderForm ({ meta, setMeta }) {
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
  if (errors || !data) return <ErrorMessages errors={errors} />

  const handleChange = (e, { name, value }) => setInput({ ...input, [name]: value })
  const onSubmit = (e) => {
    e.preventDefault()

    setMeta({ ...input })
  }

  const servers = data.servers.map(server => ({ key: server.id, value: server.id, text: server.name }))
  const headings = Array.from(Array(6)).map((value, index) => ({ key: `h${index + 1}`, value: `h${index + 1}`, text: `h${index + 1}` }))

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
        name='as'
        control={Select}
        options={headings}
        placeholder='Heading Type'
        onChange={handleChange}
        defaultValue={input.as}
      />
      <Form.Button primary>Save</Form.Button>
    </Form>
  )
}
