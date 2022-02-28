import { useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from '../Button'
import Select from '../Select'
import PlayerSelector from './PlayerSelector'
import ServerSelector from './ServerSelector'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'

export default function AssignPlayersRoleForm ({ query, roles, servers = [] }) {
  const playersRef = useRef()
  const { handleSubmit, formState, control, setValue } = useForm({
    defaultValues: {
      players: [],
      serverId: servers.length ? servers[0].id : ''
    }
  })
  const { isSubmitting } = formState
  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) {
      playersRef.current.clearValue()
    }
  }, [data])

  const onSubmit = async (data) => {
    const input = {
      players: data.players,
      role: data.role.value,
      serverId: data.serverId || undefined
    }

    await load(input)
  }
  const rolesDropdown = roles.map(role => ({ label: role.name, value: parseInt(role.id, 10) }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <div className='flex flex-col relative w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10'>
        <ErrorMessages errors={errors} />
        <PlayerSelector ref={playersRef} multiple className='mb-6' onChange={(values) => setValue('players', values)} />
        <Controller
          name='role'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Select className='mb-6' placeholder='Role' options={rolesDropdown} {...field} />}
        />
        {!!servers.length &&
          <Controller
            name='serverId'
            control={control}
            defaultValue={false}
            rules={{ required: true }}
            render={({ field }) => <ServerSelector className='mb-6' placeholder='Server' {...field} />}
          />}
        <Button data-cy='submit-players-role' disabled={isSubmitting} loading={loading} className='w-24 mb-5'>
          Assign
        </Button>
      </div>
    </form>
  )
}
