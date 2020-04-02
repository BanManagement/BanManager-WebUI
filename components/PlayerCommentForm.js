import React, { useEffect, useState } from 'react'
import { Form } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

export default function PlayerCommentForm ({ onFinish, parseVariables, query }) {
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState({})
  const [inputState, setInputState] = useState({
    message: ''
  })

  useEffect(() => setVariables(parseVariables(inputState)), [inputState])

  const { load, data, errors } = useApi({ query, variables }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => {
    setLoading(false)
  }, [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setLoading(false)
      onFinish(data)
    }
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()

    setLoading(true)
    load()
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages {...errors} />
      <Form.TextArea name='message' maxLength='250' value={inputState.message} onChange={handleChange} />
      <Form.Button content='Reply' labelPosition='left' icon='edit' primary />
    </Form>
  )
}
