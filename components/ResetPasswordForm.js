import { useEffect, useState } from 'react'
import { Form, Message } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useMutateApi } from '../utils'

export default function ResetPasswordForm () {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [inputState, setInputState] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  })

  const { load, data, errors, loading } = useMutateApi({
    query: `mutation setPassword($currentPassword: String!, $newPassword: String!) {
    setPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
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
    if (error) return

    load(inputState)
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <>
      {success &&
        <Message success header='Password successfully updated' data-cy='success' />}
      <Form size='large' onSubmit={onSubmit} error loading={loading}>
        <ErrorMessages error={error} errors={errors} />
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
        <Form.Input
          required
          name='newPassword'
          placeholder='New Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={handleChange}
          data-cy='newPassword'
        />
        <Form.Input
          required
          name='confirmPassword'
          placeholder='Confirm New Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={(e, { value }) => value !== inputState.newPassword ? setError(new Error('Passwords do not match')) : setError(null)}
          data-cy='confirmPassword'
        />
        <Form.Button fluid primary size='large' content='Save' data-cy='submit-password-change' />
      </Form>
    </>
  )
}
