import { useEffect, useState } from 'react'
import { BsTrash } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import Button from '../../Button'
import ErrorMessages from '../../ErrorMessages'
import Modal from '../../Modal'
import { useMutateApi } from '../../../utils'

export default function PlayerAppealActionDelete ({ appeal, title, type, query, onDeleted }) {
  const [open, setOpen] = useState(false)
  const { load, data, loading, errors } = useMutateApi({ query })

  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id: appeal.id })
  }
  const handleDeleteCancel = () => setOpen(false)

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key]?.appeal?.updated)) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  return (
    <>
      <Modal
        icon={<AiOutlineWarning className='h-6 w-6 text-red-600' aria-hidden='true' />}
        title={`Remove ${type}`}
        confirmButton={title}
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>Are you sure you want to remove this {type}?</p>
        <p className='pb-1'>This action cannot be undone</p>
      </Modal>
      <Button onClick={showConfirmDelete} className='bg-red-600 hover:bg-red-700'>
        <BsTrash className='text-xl mr-2' /> {title}
      </Button>
    </>
  )
}
