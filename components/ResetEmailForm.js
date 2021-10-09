import { useEffect, useState } from 'react'
import { Form, Message } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'

export default function ResetEmailForm () {
  const [success, setSuccess] = useState(false)
  const [inputState, setInputState] = useState({
    email: '',
    currentPassword: ''
  })

  const { load, loading, data, errors } = useMutateApi({
    query: `mutation setEmail($currentPassword: String!, $email: String!) {
    setEmail(currentPassword: $currentPassword, email: $email) {
      id
    }
  }`
  })

  useEffect(() => {
    setSuccess(false)
  }, [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) setSuccess(true)
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()

    load(inputState)
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <>
      {success &&
        <Message success header='Email successfully updated' data-cy='success' />}
      <Form size='large' onSubmit={onSubmit} error loading={loading}>
        <ErrorMessages errors={errors} />
        <Form.Input
          required
          name='email'
          placeholder='New Email Address'
          type='text'
          icon='mail'
          iconPosition='left'
          onChange={handleChange}
          data-cy='email'
        />
        <Form.Input
          required
          name='currentPassword'
          placeholder='Current Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={handleChange}
          data-cy='currentPassword'
        />
        <Form.Button fluid primary size='large' content='Save' data-cy='submit-email-change' />
      </Form>
    </>
  )
}
