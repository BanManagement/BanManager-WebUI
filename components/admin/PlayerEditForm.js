import { Fragment, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Avatar from '../Avatar'
import Input from '../Input'
import Modal from '../Modal'
import Select from '../Select'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import PageHeader from '../PageHeader'

export default function PlayerEditForm ({ open, onFinished, onCancel, player, roles, servers }) {
  if (!player) return null

  const { handleSubmit, register, control } = useForm({
    defaultValues: {
      email: player.email || '',
      roles: player.roles.map(({ role }) => role.id),
      serverRoles: player.serverRoles.reduce((serverRoles, { serverRole, server }) => {
        return { ...serverRoles, [server.id]: [...(serverRoles[server.id] || []), serverRole.id] }
      }, {})
    }
  })
  const { load, data, errors } = useMutateApi({
    query: `mutation setRoles($player: UUID!, $input: SetRolesInput!) {
      setRoles(player: $player, input: $input) {
        id
        player {
          name
        }
        email
        roles {
          role {
            id
            name
          }
        }
        serverRoles {
          serverRole {
            id
            name
          }
          server {
            id
          }
        }
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) onFinished(data)
  }, [data])

  const onSubmit = (data) => {
    const serverRoles = []

    for (const [serverId, roles] of Object.entries(data.serverRoles)) {
      if (!roles) continue

      roles.forEach(roleId => serverRoles.push(({ role: { id: roleId }, server: { id: serverId } })))
    }

    load({
      player: player.id,
      input: {
        roles: data.roles.map(id => ({ id })),
        serverRoles
      }
    })
  }
  const serversDropdown = servers.map(server => ({ value: server.id, label: server.name }))
  const rolesDropdown = roles.map(role => ({ label: role.name, value: role.id }))

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onConfirm={handleSubmit(onSubmit)}
      confirmButton='Save'
      title={
        <div className='flex items-center'>
          <span className='flex-shrink-0'>
            <Avatar uuid={player.id} height={45} width={45} />
          </span>
          <span className='ml-3'>{player.player.name}</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
        <ErrorMessages errors={errors} />
        {player.email &&
          <Input
            placeholder='Email'
            readOnly
            {...register('email')}
          />}
        <PageHeader title='Global Roles' className='!text-xl' />
        <Controller
          name='roles'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Select
            className='mb-6'
            options={rolesDropdown}
            placeholder='Role'
            isMulti
            {...field}
            onChange={(selectedOption) => {
              field.onChange(selectedOption.map(option => option.value))
            }}
                                 />}
        />
        {serversDropdown.map(server => {
          return (
            <Fragment key={server.value}>
              <PageHeader title={server.label} className='!text-xl' />
              <Controller
                name={`serverRoles.${server.value}`}
                control={control}
                render={({ field }) => <Select
                  className='mb-6'
                  options={rolesDropdown}
                  placeholder='Role'
                  isMulti
                  {...field}
                  onChange={(selectedOption) => {
                    field.onChange(selectedOption.map(option => option.value))
                  }}
                                       />}
              />
            </Fragment>
          )
        })}
      </form>
    </Modal>
  )
}
