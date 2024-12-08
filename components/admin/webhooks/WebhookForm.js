import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import Button from '../../Button'
import PageHeader from '../AdminHeader'
import ErrorMessages from '../../ErrorMessages'
import Select from '../../Select'
import Input from '../../Input'
import TextArea from '../../TextArea'
import ServerSelector from '../ServerSelector'
import { useApi, useMutateApi } from '../../../utils'
import { TbHttpPost } from 'react-icons/tb'
import JsonPreview from './JsonPreview'
import { AiOutlineCopy } from 'react-icons/ai'

export default function WebhookCustomForm ({ onFinished, query, parseVariables, eventTypes, defaults = {} }) {
  const errorRef = useRef(null)
  const { handleSubmit, formState, control, register, watch } = useForm({
    defaultValues: {
      url: defaults?.url,
      // eslint-disable-next-line no-template-curly-in-string
      contentTemplate: defaults?.contentTemplate || '{"content": "Hello, ${actorName}!"}',
      type: defaults?.type,
      serverId: defaults?.server?.id,
      contentType: 'APPLICATION_JSON',
      templateType: 'CUSTOM'
    }
  })
  const { isSubmitting } = formState
  const [variables, setVariables] = useState(null)
  const { data: examplePayload } = useApi({
    query: watch('type')
      ? `query webhookExamplePayload($type: WebhookType!) {
      webhookExamplePayload(type: $type)
    }`
      : null,
    variables: { type: watch('type') }
  })
  const { load, loading, data, errors } = useMutateApi({ query })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => data[key] && data[key].id)) onFinished(data)
  }, [data])
  useEffect(() => {
    if (errors) errorRef.current.scrollIntoView()
  }, [errors])
  useEffect(() => {
    if (examplePayload && !variables) setVariables(examplePayload?.webhookExamplePayload)
  }, [examplePayload])

  const onSubmit = (data) => {
    const { id, ...input } = data

    load(parseVariables(input))
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
      <form onSubmit={handleSubmit(onSubmit)} className='col-span-3'>
        <ErrorMessages ref={errorRef} errors={errors} className='shrink' />
        <PageHeader title='Event Type' className='!text-xl' />
        <Controller
          name='type'
          control={control}
          rules={{ required: true }}
          render={({ field }) => <Select
            className='mb-6'
            {...field}
            onChange={(selectedOption) => {
              field.onChange(selectedOption.value)
            }}
            options={eventTypes}
                                 />}
        />
        <PageHeader title='Server (optional)' className='!text-xl' />
        <Controller
          name='serverId'
          control={control}
          defaultValue={false}
          render={({ field }) => <ServerSelector isClearable className='mb-6' placeholder='Server' {...field} />}
        />
        <PageHeader title='URL' className='!text-xl' />
        <Input
          required
          placeholder='https://example.com/webhook'
          icon={<TbHttpPost />}
          type='url'
          {...register('url')}
        />
        <Button data-cy='submit-server-form' disabled={isSubmitting} loading={loading}>Save</Button>
      </form>
      <div className='col-span-5'>
        <PageHeader title='Content Template' className='!text-xl'>
          <p className='text-sm'>Use the variables defined to customize the content</p>
        </PageHeader>
        <TextArea
          required
          rows={10}
          placeholder='{"content": "Hello, world!"}'
          {...register('contentTemplate')}
        />
        <PageHeader title='Available Variables' className='!text-xl' />
        {variables && (
          <div className='flex flex-col'>
            {Object.keys(variables).map(key => (
              <div className='flex gap-2' key={key}>
                <Input
                  readOnly
                  value={`\${${key}}`}
                  className='mb-2'
                  icon={<AiOutlineCopy
                    className='w-6 h-6 hover:opacity-80 cursor-pointer'
                    onClick={() => { navigator.clipboard.writeText(`\${${key}}`) }}
                        />}
                />
                <Input
                  value={variables[key]}
                  className='mb-2'
                  onChange={(e) => {
                    const newVariables = { ...variables }
                    newVariables[key] = e.target.value
                    setVariables(newVariables)
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className='col-span-4'>
        <PageHeader title='Preview' className='!text-xl' />
        <JsonPreview json={watch('contentTemplate')} variables={variables} />
      </div>
    </div>
  )
}
