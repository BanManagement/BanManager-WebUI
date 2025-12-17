/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiTrash2, FiExternalLink, FiZoomIn, FiX } from 'react-icons/fi'
import Modal from '../Modal'
import { formatBytes, fromNow, useMutateApi } from '../../utils'

function ImageModal ({ document, onClose }) {
  if (!document) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80'
      onClick={onClose}
    >
      <button
        className='absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors'
        onClick={onClose}
      >
        <FiX className='w-8 h-8' />
      </button>
      <img
        src={`${process.env.BASE_PATH || ''}/api/documents/${document.id}`}
        alt={document.filename}
        className='max-w-[90vw] max-h-[90vh] object-contain'
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

function DocumentRow ({ document, onDelete }) {
  const [showZoom, setShowZoom] = useState(false)
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
      onDelete(document.id)
    }
  }, [data])

  const handleDelete = async () => {
    await load({ id: document.id })
  }

  return (
    <>
      <tr className='border-b border-primary-700 hover:bg-primary-700/30 transition-colors'>
        <td className='px-4 py-3'>
          <div className='flex items-center gap-3'>
            <img
              src={`${process.env.BASE_PATH || ''}/api/documents/${document.id}`}
              alt={document.filename}
              className='w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => setShowZoom(true)}
            />
            <div>
              <p className='font-medium text-gray-200 truncate max-w-xs' title={document.filename}>
                {document.filename}
              </p>
              <p className='text-xs text-gray-400'>
                {document.mimeType} • {formatBytes(document.size)}
                {document.width && document.height && ` • ${document.width}×${document.height}`}
              </p>
            </div>
          </div>
        </td>
        <td className='px-4 py-3'>
          {document.player
            ? (
              <Link href={`/player/${document.player.id}`} className='text-accent-500 hover:text-accent-400 transition-colors'>
                {document.player.name}
              </Link>
              )
            : (
              <span className='text-gray-500'>Unknown</span>
              )}
        </td>
        <td className='px-4 py-3'>
          {document.usages && document.usages.length > 0
            ? (
              <div className='flex flex-wrap gap-1'>
                {document.usages.map((usage, i) => {
                  let href
                  if (usage.type === 'appeal') {
                    href = `/appeals/${usage.id}`
                  } else if (usage.type === 'appeal_comment') {
                    href = `/appeals/${usage.id}#comment-${usage.commentId}`
                  } else {
                    href = `/reports/${usage.serverId}/${usage.id}#comment-${usage.commentId}`
                  }

                  return (
                    <Link
                      key={`${usage.type}-${usage.id}-${usage.commentId || 0}-${i}`}
                      href={href}
                      className='inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary-600 text-gray-300 hover:bg-primary-500 hover:text-white transition-colors'
                    >
                      {usage.label}
                    </Link>
                  )
                })}
              </div>
              )
            : (
              <span className='text-gray-500 text-sm'>Not attached</span>
              )}
        </td>
        <td className='px-4 py-3 text-gray-400'>
          {fromNow(document.created)}
        </td>
        <td className='px-4 py-3'>
          <div className='flex items-center gap-2'>
            <button
              className='p-2 text-gray-400 hover:text-white hover:bg-primary-600 rounded transition-colors'
              onClick={() => setShowZoom(true)}
              title='View full size'
            >
              <FiZoomIn className='w-4 h-4' />
            </button>
            <a
              href={`${process.env.BASE_PATH || ''}/api/documents/${document.id}`}
              target='_blank'
              rel='noopener noreferrer'
              className='p-2 text-gray-400 hover:text-white hover:bg-primary-600 rounded transition-colors'
              title='Open in new tab'
            >
              <FiExternalLink className='w-4 h-4' />
            </a>
            {document.acl?.delete && (
              <button
                className='p-2 text-gray-400 hover:text-red-400 hover:bg-primary-600 rounded transition-colors'
                onClick={() => setConfirmDelete(true)}
                title='Delete'
              >
                <FiTrash2 className='w-4 h-4' />
              </button>
            )}
          </div>
        </td>
      </tr>

      {showZoom && (
        <ImageModal document={document} onClose={() => setShowZoom(false)} />
      )}

      <Modal
        title='Delete Document'
        confirmButton='Delete'
        open={confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
        loading={loading}
      >
        <p className='pb-1'>Are you sure you want to delete this document?</p>
        <p className='pb-1 text-gray-400'>This action cannot be undone and will remove the image from any appeals it was attached to.</p>
        {errors && errors.length > 0 && <p className='text-red-500 text-sm'>{errors[0]?.message}</p>}
      </Modal>
    </>
  )
}

export default function DocumentsTable ({ documents, onDelete }) {
  return (
    <div className='overflow-x-auto bg-primary-800 rounded-lg'>
      <table className='w-full'>
        <thead>
          <tr className='text-left text-gray-400 text-sm border-b border-primary-600'>
            <th className='px-4 py-3 font-medium'>Document</th>
            <th className='px-4 py-3 font-medium'>Uploaded By</th>
            <th className='px-4 py-3 font-medium'>Used In</th>
            <th className='px-4 py-3 font-medium'>Date</th>
            <th className='px-4 py-3 font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <DocumentRow key={doc.id} document={doc} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
