import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { AiOutlineUser } from 'react-icons/ai'
import dynamic from 'next/dynamic'
import Message from './Message'
import Input from './Input'
import Button from './Button'
import ServerSelector from './admin/ServerSelector'
import { MdPin } from 'react-icons/md'

const ReactCodeInput = dynamic(() => import('@acusti/react-code-input'), { ssr: false })

export default function PlayerLoginPinForm ({ onSuccess, showHint }) {
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register, control} = useForm()
  const { isSubmitting } = formState

  const onSubmit = async (data) => {
    try {
      const response = await fetch((process.env.BASE_PATH || '') + '/api/session',
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
        <Controller
          name='serverId'
          control={control}
          defaultValue={false}
          rules={{ required: true }}
          render={({ field }) => <ServerSelector className='mb-6' {...field} />}
        />
        <Input
          required
          label='Minecraft Username'
          icon={<AiOutlineUser />}
          iconPosition='left'
          error={error?.message}
          {...register('name')}
        />
        {showHint && (
          <Message info>
            <Message.Header>Your 6 digit pin</Message.Header>
            <Message.List>
              <Message.Item>Join the chosen Minecraft server &amp; type /bmpin or use the pin from the banned screen</Message.Item>
            </Message.List>
          </Message>)}
        <Controller
          name='pin'
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <div className='flex bg-primary-900 rounded-3xl mb-6'>
              <span className='inline-flex items-center px-3 text-gray-400 text-lg'><MdPin /></span>
              <ReactCodeInput
                fields={6}
                className='!flex relative'
                inputMode='numeric'
                filterChars={[...Array(10).keys()].map(i => i.toString())}
                placeholder='-'
                filterCharsIsWhitelist
                {...field}
                autoFocus={false}
              />
            </div>)}
        />
        <Button data-cy='submit-login-pin' disabled={isSubmitting} loading={isSubmitting}>
          Login
        </Button>
      </div>
    </form>
  )
}
