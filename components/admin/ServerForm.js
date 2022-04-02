import { useEffect, useRef, useState } from 'react'
import { load as safeLoad } from 'js-yaml'
import { useForm } from 'react-hook-form'
import Input from '../Input'
import TextArea from '../TextArea'
import Button from '../Button'
import ErrorMessages from '../ErrorMessages'
import PageHeader from '../PageHeader'
import { useMutateApi } from '../../utils'

export default function ServerForm ({ onFinished, query, parseVariables, serverTables, defaults = {} }) {
  const errorRef = useRef(null)
  const [yamlState, setYamlState] = useState('')
  const { handleSubmit, formState, register, setValue } = useForm({ defaultValues: { ...defaults, console: defaults?.console?.id } })
  const { isSubmitting } = formState

  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished()
  }, [data])
  useEffect(() => {
    if (errors) errorRef.current.scrollIntoView()
  }, [errors])

  const onSubmit = (data) => {
    const { id, ...input } = data

    load(parseVariables(input))
  }
  const handleYamlConfig = async (e, { value }) => {
    if (!value) return

    const config = safeLoad(value)

    if (!config || typeof config === 'string' || typeof config === 'number') {
      // Ignore invalid YAML
      setYamlState('')
      return
    }

    // Pick only web used tables
    // const tables = pick(config.databases.local.tables, serverTables)

    setValue('host', config.databases.local.host)
    setValue('port', config.databases.local.port)
    setValue('database', config.databases.local.name)
    setValue('user', config.databases.local.user)
    setValue('password', config.databases.local.password)

    serverTables.forEach(table => setValue(`tables.${table}`, config.databases.local.tables[table]))
  }
  const tableInputs = serverTables.map(name => (
    <Input
      key={'server-table-' + name}
      required
      placeholder={name}
      {...register(`tables.${name}`)}
    />
  ))

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='mx-auto'>
      <ErrorMessages ref={errorRef} errors={errors} />
      <div className='grid grid-flow-row md:grid-flow-col gap-6'>
        <div className='grid-flow-col'>
          <PageHeader title='Info' />
          <Input
            required
            placeholder='Name'
            {...register('name')}
          />
          <Input
            required
            placeholder='Console UUID (BanManager/console.yml)'
            minLength={16}
            {...register('console')}
          />
          <TextArea
            placeholder='Paste YAML BanManager/config.yml (Optional)'
            value={yamlState}
            name='yaml'
            onChange={handleYamlConfig}
          />
        </div>
        <div className='grid-flow-col'>
          <PageHeader title='Database' />
          <Input
            required
            placeholder='Host'
            {...register('host')}
          />
          <Input
            required
            placeholder='Port'
            {...register('port', { valueAsNumber: true })}
          />
          <Input
            required
            placeholder='Database Name'
            {...register('database')}
          />
          <Input
            required
            placeholder='User'
            {...register('user')}
          />
          <Input
            placeholder='Password'
            type='password'
            {...register('password')}
          />
        </div>
      </div>
      <PageHeader title='Database Tables' />
      {tableInputs}
      <Button data-cy='submit-server-form' disabled={isSubmitting} loading={loading}>Save</Button>
    </form>
  )
}
