import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { AiOutlineUser } from 'react-icons/ai'
import dynamic from 'next/dynamic'
import Input from './Input'
import Button from './Button'
import ServerSelector from './admin/ServerSelector'
import { MdPin } from 'react-icons/md'

const ReactCodeInput = dynamic(() => import('@acusti/react-code-input'), { ssr: false })

export default function PlayerLoginPinForm ({ onSuccess, showHint }) {
  const [error, setError] = useState(null)
  const { handleSubmit, formState, register, control } = useForm()
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
          <div className='flex gap-4 text-left mb-6 rounded-3xl border-primary-900 border-2 p-2'>
            <Button disabled className='w-12 h-12'><MdPin /></Button>
            <div>
              <p className='underline'>Your 6 digit pin, e.g. <code>123456</code></p>
              <p className='text-sm text-gray-400'>This can be found when you join the Minecraft server, either on the ban screen or by using the <code className='bg-primary-900'>/bmpin</code> command.</p>
              <p className='text-sm text-gray-400 mt-2'>Note: this pin expires after 5 minutes.</p>
            </div>
          </div>)}
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
