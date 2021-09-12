import { useState } from 'react';
import { Form } from 'semantic-ui-react'

export default function SearchBoxForm ({ meta, setMeta }) {
  const [input, setInput] = useState({ ...meta })
  const handleChange = (e, { name, value }) => setInput({ ...input, [name]: value })
  const onSubmit = (e) => {
    e.preventDefault()

    setMeta({ ...input })
  }

  return (
    <Form size='large' error onSubmit={onSubmit}>
      <Form.Input
        label='Icon Src'
        placeholder='Icon Src'
        name='iconSrc'
        onChange={handleChange}
        value={input.iconSrc}
      />
      <Form.Input
        label='Network Name'
        placeholder='Network Name'
        name='name'
        onChange={handleChange}
        value={input.name}
      />
      <Form.Checkbox
        label='Show Player Search'
        name='showPlayerSearch'
        onChange={handleChange}
        checked={input.showPlayerSearch}
        toggle
      />
      <Form.Checkbox
        label='Show IP Search'
        name='showIpSearch'
        onChange={handleChange}
        checked={input.showIpSearch}
        toggle
      />
      <Form.Button primary>Save</Form.Button>
    </Form>
  )
}
