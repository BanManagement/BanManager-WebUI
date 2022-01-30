import { Fragment, useEffect, useRef } from 'react'
import { cloneDeep, find } from 'lodash-es'
import { useForm, Controller } from 'react-hook-form'
import Input from '../Input'
import Checkbox from '../Checkbox'
import Button from '../Button'
import Select from '../Select'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'
import PageHeader from '../PageHeader'

const sanitiseName = (name) => name.replace(/\./g, '_')
const desanitiseName = (name) => name.replace(/_/g, '.')

export default function RoleForm ({ onFinished, query, parseVariables, parentRoles, resources, defaults = {} }) {
  const defaultResources = {}

  ;(defaults.resources || resources || []).forEach(resource => {
    defaultResources[sanitiseName(resource.name)] = {}

    resource.permissions.forEach(permission => {
      defaultResources[sanitiseName(resource.name)][sanitiseName(permission.name)] = permission.allowed
    })
  })

  const errorRef = useRef(null)
  const { handleSubmit, formState, register, control } = useForm({
    defaultValues: {
      name: defaults.name || '',
      resources: defaultResources,
      parent: defaults.parent || parentRoles[0].value
    }
  })
  const { isSubmitting } = formState

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished(data)
  }, [data])
  useEffect(() => {
    if (errors) errorRef.current.scrollIntoView()
  }, [errors])

  const onSubmit = (data) => {
    const res = cloneDeep(defaults.resources || resources)

    for (const [resName, permissions] of Object.entries(data.resources)) {
      const resource = find(res, { name: desanitiseName(resName) })

      for (const [permName, allowed] of Object.entries(permissions)) {
        const name = desanitiseName(permName)
        const permission = find(resource.permissions, { name })
        permission.allowed = typeof allowed === 'boolean' ? allowed : allowed === 'true'
      }
    }

    load(parseVariables({ ...data, resources: res, parent: data?.parent?.value }))
  }

  const resourceInputs = resources.map(resource => (
    <Fragment key={resource.name}>
      <PageHeader title={resource.name} className='!text-lg' />
      <div className='grid'>
        {resource.permissions.map(permission => (
          <Checkbox
            key={`resource-${resource.name}-${permission.name}`}
            label={permission.name}
            {...register(`resources.${sanitiseName(resource.name)}.${sanitiseName(permission.name)}`)}
          />
        ))}
      </div>
    </Fragment>
  ))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <PageHeader title='Edit Role' />
      <ErrorMessages ref={errorRef} errors={errors} />
      <Input
        required
        placeholder='Name'
        {...register('name')}
      />
      {(!defaults.id || defaults.id > 3) &&
        <Controller
          name='parent'
          control={control}
          render={({ field }) => <Select className='mb-6' {...field} options={parentRoles} />}
        />}
      <PageHeader title='Resources' className='!text-xl' />
      {defaults.id === '3' &&
        <p>{defaults.name} has access to all resources</p>}
      {(!defaults.id || defaults.id !== '3') && resourceInputs}
      <Button data-cy='submit-server-form' disabled={isSubmitting} loading={loading}>Save</Button>
    </form>
  )
}
