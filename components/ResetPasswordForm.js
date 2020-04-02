import React, { useEffect, useState } from 'react'
import { Form, Message } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { useApi } from '../utils'

export default function ResetPasswordForm () {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [variables, setVariables] = useState({})
  const [inputState, setInputState] = useState({
    newPassword: '',
    confirmPassword: '',
    currentPassword: ''
  })

  useEffect(() => setVariables(inputState), [inputState])

  const { load, data, errors } = useApi({
    query: `mutation setPassword($currentPassword: String!, $newPassword: String!) {
    setPassword(currentPassword: $currentPassword, newPassword: $newPassword) {
      id
    }
  }`,
    variables
  }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => {
    setLoading(false)
    setSuccess(false)
  }, [errors])
  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) setSuccess(true)
  }, [data])

  const onSubmit = (e) => {
    e.preventDefault()
    if (error) return

    setLoading(true)
    load()
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <>
      {success &&
        <Message success header='Password successfully updated' />}
      <Form size='large' onSubmit={onSubmit} error loading={loading}>
        <ErrorMessages error={error} {...errors} />
        <Form.Input
          required
          name='currentPassword'
          placeholder='Current Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={handleChange}
        />
        <Form.Input
          required
          name='newPassword'
          placeholder='New Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={handleChange}
        />
        <Form.Input
          required
          name='confirmPassword'
          placeholder='Confirm New Password'
          type='password'
          icon='lock'
          iconPosition='left'
          onChange={(e, { value }) => value !== inputState.newPassword ? setError(new Error('Passwords do not match')) : setError(null)}
        />
        <Form.Button fluid primary size='large' content='Save' />
      </Form>
    </>
  )
}
