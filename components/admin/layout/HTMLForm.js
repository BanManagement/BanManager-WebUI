import React, { useState } from 'react'
import { Form, TextArea } from 'semantic-ui-react'

export default function HTMLForm ({ meta, setMeta }) {
  const [html, setHtml] = useState(meta.html)
  const onSubmit = (e) => {
    e.preventDefault()

    setMeta({ html })
  }

  return (
    <Form size='large' error onSubmit={onSubmit}>
      <TextArea
        placeholder='HTML'
        name='html'
        onChange={(e, { value }) => setHtml(value)}
        value={html}
      />
      <Form.Button primary>Save</Form.Button>
    </Form>
  )
}
