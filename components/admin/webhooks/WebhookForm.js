import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations()
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
      <form onSubmit={handleSubmit(onSubmit)} className='col-span-3' data-cy='webhook-form' data-cy-template='CUSTOM'>
        <ErrorMessages ref={errorRef} errors={errors} className='shrink' />
        <PageHeader title={t('pages.admin.webhooks.form.eventType')} className='!text-xl' />
        <div data-cy='webhook-type'>
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
        </div>
        <PageHeader title={t('pages.admin.webhooks.form.serverOptional')} className='!text-xl' />
        <div data-cy='webhook-server'>
          <Controller
            name='serverId'
            control={control}
            defaultValue={false}
            render={({ field }) => <ServerSelector isClearable className='mb-6' placeholder={t('pages.admin.webhooks.form.server')} {...field} />}
          />
        </div>
        <PageHeader title={t('pages.admin.webhooks.form.url')} className='!text-xl' />
        <Input
          required
          placeholder={t('pages.admin.webhooks.form.urlPlaceholderCustom')}
          icon={<TbHttpPost />}
          type='url'
          data-cy='webhook-url'
          {...register('url')}
        />
        <Button data-cy='submit-webhook-form' disabled={isSubmitting} loading={loading}>{t('common.save')}</Button>
      </form>
      <div className='col-span-5'>
        <PageHeader title={t('pages.admin.webhooks.form.contentTemplate')} className='!text-xl'>
          <p className='text-sm'>{t('pages.admin.webhooks.form.contentHint')}</p>
        </PageHeader>
        <TextArea
          required
          rows={10}
          placeholder='{"content": "Hello, world!"}'
          data-cy='webhook-content-template'
          {...register('contentTemplate')}
        />
        <PageHeader title={t('pages.admin.webhooks.form.availableVariables')} className='!text-xl' />
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
        <PageHeader title={t('pages.admin.webhooks.form.preview')} className='!text-xl' />
        <JsonPreview json={watch('contentTemplate')} variables={variables} />
      </div>
    </div>
  )
}
