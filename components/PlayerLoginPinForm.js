import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { AiOutlineUser } from 'react-icons/ai'
import ReactCodeInput from '@acusti/react-code-input'
import ErrorMessages from './ErrorMessages'
import Message from './Message'
import Input from './Input'
import Button from './Button'
import ServerSelector from './admin/ServerSelector'

export default function PlayerLoginPinForm ({ onSuccess }) {
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register, control } = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/session',
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      if (response.status !== 200) {
        const responseData = await response.json()

        throw new Error(responseData.error)
      } else {
        const responseData = await response.json()

        onSuccess({ responseData })
      }
    } catch (e) {
      setError(e)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <div className='flex flex-col relative w-full max-w-md md:px-8 lg:px-10'>
        <ErrorMessages error={error} />
        <Controller
          name='serverId'
          control={control}
          defaultValue={false}
          rules={{ required: true }}
          render={({ field }) => <ServerSelector className='mb-6' {...field} />}
        />
        <Input
          required
          placeholder='Minecraft Username'
          icon={<AiOutlineUser />}
          iconPosition='left'
          {...register('name')}
        />
        <Message info>
          <Message.Header>Your 6 digit pin</Message.Header>
          <Message.List>
            <Message.Item>Join the chosen Minecraft server &amp; type /bmpin or use the pin from the banned screen</Message.Item>
          </Message.List>
        </Message>
        <Controller
          name='pin'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <ReactCodeInput
            fields={6}
            className='!flex relative mb-6'
            inputMode='numeric'
            filterChars={[...Array(10).keys()].map(i => i.toString())}
            filterCharsIsWhitelist
            {...field}
            autoFocus={false}
                                 />}
        />
        <Button data-cy='submit-login-pin' disabled={isSubmitting} loading={isSubmitting}>
          Login
        </Button>
      </div>
    </form>
  )
}
