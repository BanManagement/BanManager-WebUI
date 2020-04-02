import React, { useEffect, useState } from 'react'
import { Form } from 'semantic-ui-react'
import { GlobalStore } from './GlobalContext'
import ErrorMessages from './ErrorMessages'

export default function PlayerLoginPasswordForm () {
  const store = GlobalStore()
  const origin = store.get('origin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [inputState, setInputState] = useState({
    email: '',
    password: ''
  })

  useEffect(() => setLoading(false), [error])

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`${origin}/api/session`,
        {
          method: 'POST',
          body: JSON.stringify(inputState),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status === 204) {
        window.location.replace('/')
      } else if (response.status !== 204) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      } else {
        const responseData = await response.json()

        if (responseData.hasAccount) return window.location.replace('/')

        window.location.replace('/register')
      }
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
        placeholder='Email address'
        icon='user'
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
      <Form.Button fluid primary size='large' content='Login' />
    </Form>
  )
}
