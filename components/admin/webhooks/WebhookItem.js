import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BiServer } from 'react-icons/bi'
import { MdSettings } from 'react-icons/md'
import { FaPencilAlt, FaDiscord } from 'react-icons/fa'
import { BsFillSendFill, BsTrash } from 'react-icons/bs'
import Button from '../../Button'
import { TimeFromNow } from '../../Time'
import Modal from '../../Modal'
import { useMutateApi } from '../../../utils'
import ErrorMessages from '../../ErrorMessages'
import WebhookTestForm from './WebhookTestForm'

const webhookTypes = {
  CUSTOM: <MdSettings className='self-center' />,
  DISCORD: <FaDiscord className='self-center' />
}

const query = `mutation sendTestWebhook($id: ID!, $variables: JSONObject!) {
  sendTestWebhook(id: $id, variables: $variables) {
    id
    response
    content
    created
  }
}`

export default function WebhookItem ({ row, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [testWebhookOpen, setTestWebhookOpen] = useState(false)
  const { load, loading, errors, data } = useMutateApi({
    query: `mutation deleteWebhook($id: ID!) {
        deleteWebhook(id: $id) {
          id
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key])) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id: row.id })
  }
  const handleDeleteCancel = () => setOpen(false)
  const showTestWebhook = (e) => {
    e.preventDefault()

    setTestWebhookOpen(true)
  }
  const handleTestWebhookCancel = () => setTestWebhookOpen(false)

  return (
    <div className='hover:bg-gray-900 group border-b border-gray-700'>
      <Modal
        title='Delete webhook'
        confirmButton='Delete'
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>Are you sure you want to delete this webhook?</p>
        <p className='pb-1'>This action cannot be undone</p>
      </Modal>
      <Modal
        title='Test webhook'
        open={testWebhookOpen}
        onCancel={handleTestWebhookCancel}
      >
        <WebhookTestForm id={row?.id} variables={row?.examplePayload} query={query} />
      </Modal>
      <div className='flex py-2'>
        <div className='flex-auto flex-wrap space-y-2 pl-3 py-2 max-w-full'>
          <div>
            {row.type}
          </div>
          <div className='flex flex-auto flex-row space-x-2 py-2 items-center'>
            <span>{webhookTypes[row?.templateType]}</span>
            <Link href={`/admin/webhooks/${row.id}`} className='truncate underline block'>{row?.url}</Link>
          </div>
          {!!row?.server?.id &&
            <div className='flex break-words justify-between text-sm'>
              <div className='flex justify-between gap-2'>
                <BiServer className='self-center' /> <Link href={`/admin/server/${row?.server?.id}`} className='underline'>{row?.server?.name}</Link>
              </div>
            </div>}
        </div>
        <div className='flex flex-col justify-center pl-3 mt-1 mr-2'>
          <div className='group-hover:hidden'>
            <TimeFromNow timestamp={Math.floor(row.updated / 1000)} />
          </div>
          <div className='hidden group-hover:flex group-hover:gap-5'>
            <Button className='bg-accent-600 hover:bg-accent-700 text-sm px-4 py-2' onClick={showTestWebhook}><BsFillSendFill /></Button>
            <Link href={`/admin/webhooks/${row.id}`} passHref>
              <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><FaPencilAlt /></Button>
            </Link>
            <Button className='bg-red-600 hover:bg-red-700 text-sm px-4 py-2' onClick={showConfirmDelete}><BsTrash /></Button>
          </div>
        </div>
      </div>
      <div className='flex flex-row gap-6 md:hidden mb-2'>
        <div>
          <Button className='bg-accent-600 hover:bg-accent-700 text-sm px-4 py-2' onClick={showTestWebhook}><BsFillSendFill /> Test</Button>
        </div>
        <div>
          <Link href={`/admin/webhooks/${row.id}`} passHref>
            <Button className='bg-emerald-600 hover:bg-emerald-700 text-sm px-4 py-2'><FaPencilAlt /> Edit</Button>
          </Link>
        </div>
        <div>
          <Button className='bg-red-600 hover:bg-red-700 text-sm px-4 py-2' onClick={showConfirmDelete}><BsTrash /> Delete</Button>
        </div>
      </div>
    </div>
  )
}
