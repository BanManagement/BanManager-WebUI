import React, { useEffect, useState } from 'react'
import { Form } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import ErrorMessages from './ErrorMessages'

export default function PlayerRegisterForm () {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inputState, setInputState] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => setLoading(false), [error])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (inputState.password !== inputState.confirmPassword) {
      return setError(new Error('Passwords do not match'))
    }

    try {
      const response = await fetch('/api/register',
        {
          method: 'POST',
          body: JSON.stringify(inputState),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status !== 204) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      }

      router.push('/')
    } catch (e) {
      setError(e)
    }
  }
  const handleChange = async (e, { name, value }) => {
    setInputState({ ...inputState, [name]: value })
  }

  return (
    <Form size='large' onSubmit={onSubmit} error loading={loading}>
      <ErrorMessages error={error} />
      <Form.Input
        required
        name='email'
        placeholder='Email Address'
        type='text'
        icon='mail'
        iconPosition='left'
        onChange={handleChange}
      />
      <Form.Input
        required
        name='password'
        placeholder='Password'
        type='password'
        icon='lock'
        iconPosition='left'
        onChange={handleChange}
      />
      <Form.Input
        required
        name='confirmPassword'
        placeholder='Confirm Password'
        type='password'
        icon='lock'
        iconPosition='left'
        onChange={handleChange}
      />
      <Form.Button fluid primary size='large' content='Confirm' />
      <Form.Button fluid size='large' content='Skip' onClick={() => router.push('/')} />
    </Form>
  )
}
