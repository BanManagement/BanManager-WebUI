/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import { FiTrash2 } from 'react-icons/fi'
import Modal from './Modal'
import { useMutateApi } from '../utils'

function DocumentItem ({ document, onDelete, canDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { load, loading, data, errors } = useMutateApi({
    query: `mutation deleteDocument($id: ID!) {
      deleteDocument(id: $id) {
        id
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (data?.deleteDocument?.id) {
      setConfirmDelete(false)
      if (typeof onDelete === 'function') {
        onDelete(document.id)
      }
    }
  }, [data])

  const handleDelete = async () => {
    await load({ id: document.id })
  }

  const imageUrl = `${process.env.BASE_PATH || ''}/api/documents/${document.id}`

  return (
    <>
      <div data-cy='document-item' className='relative group inline-block'>
        <a
          href={imageUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='block'
        >
          <img
            src={imageUrl}
            alt={document.filename}
            className='max-w-full rounded-md border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer'
          />
        </a>
        {canDelete && (
          <button
            data-cy='document-delete'
            className='absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity'
            onClick={() => setConfirmDelete(true)}
            title='Delete image'
          >
            <FiTrash2 className='w-4 h-4' />
          </button>
        )}
      </div>

      <Modal
        title='Delete Image'
        confirmButton='Delete'
        open={confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={loading}
      >
        <p className='pb-1'>Are you sure you want to delete this image?</p>
        <p className='pb-1 text-gray-400'>This action cannot be undone.</p>
        {errors && <p className='text-red-500 text-sm'>{errors[0]?.message}</p>}
      </Modal>
    </>
  )
}

export default function DocumentGallery ({ documents = [], onDelete, canDelete = false }) {
  if (!documents || documents.length === 0) return null

  return (
    <div className='flex flex-col gap-3 mt-4'>
      {documents.map(doc => (
        <DocumentItem
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          canDelete={canDelete || doc.acl?.delete}
        />
      ))}
    </div>
  )
}
