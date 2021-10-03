import { useEffect, useState } from 'react'
import { Form } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'

export default function PlayerCommentForm ({ onFinish, parseVariables, query }) {
  const [inputState, setInputState] = useState({
    comment: ''
  })

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setInputState({ ...inputState, comment: '' })
      onFinish(data)
    }
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()

    load(parseVariables(inputState))
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages errors={errors} />
      <Form.TextArea name='comment' maxLength='250' value={inputState.comment} onChange={handleChange} />
      <Form.Button content='Reply' labelPosition='left' icon='edit' primary />
    </Form>
  )
}
