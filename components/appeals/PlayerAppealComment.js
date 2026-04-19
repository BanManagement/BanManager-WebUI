import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import ErrorMessages from '../ErrorMessages'
import Modal from '../Modal'
import { fromNow, useMutateApi } from '../../utils'
import Avatar from '../Avatar'
import DocumentGallery from '../DocumentGallery'

export default function PlayerAppealComment ({ id, actor, created, content, acl, documents, onDelete, onDocumentDelete }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const { load, data, loading, errors } = useMutateApi({
    query: `mutation deleteAppealComment($id: ID!) {
      deleteAppealComment(id: $id) {
        id
        acl {
          delete
        }
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      setOpen(false)
      onDelete(data)
    }
  }, [data])
  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    await load({ id })
  }
  const handleDeleteCancel = () => setOpen(false)

  return (
    <div className='md:ml-4 pt-3 pb-3 relative scroll-mt-20' id={`comment-${id}`}>
      <Link href={`/player/${actor.id}`} className='absolute -left-20 hidden md:block'>
        <Avatar uuid={actor.id} width={40} height={40} className='mx-1 inline-block relative' />
      </Link>
      <Modal
        title={t('pages.appeals.deleteCommentTitle')}
        confirmButton={t('common.delete')}
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>{t('pages.appeals.deleteCommentConfirm')}</p>
        <p className='pb-1'>{t('pages.punishment.actionUndoable')}</p>
      </Modal>
      <div className='-ml-8 md:-ml-4 rounded-3xl bg-primary-900'>
        <div className='rounded-tl rounded-tr relative justify-between items-center flex border-b border-primary-400 py-2 px-4 text-sm text-gray-300'>
          <div className='items-center flex'>
            <span>
              {t.rich('pages.appeals.commentedAt', {
                actorName: actor.name,
                relative: fromNow(created),
                actor: (chunks) => <Link href={`/player/${actor.id}`} className='font-semibold'>{chunks}</Link>,
                time: (chunks) => <Link href={`#comment-${id}`}><span>{chunks}</span></Link>
              })}
            </span>
          </div>
          <div className='items-center flex'>
            {acl?.delete && <a className='cursor-pointer' onClick={showConfirmDelete}>{t('common.delete')}</a>}
          </div>
        </div>
        <div className='rounded-bl rounded-br relative p-4 top-0 bottom-0'>
          <p className='break-all'>{content}</p>
          {documents && documents.length > 0 && (
            <DocumentGallery
              documents={documents}
              onDelete={onDocumentDelete}
            />
          )}
        </div>
      </div>
    </div>
  )
}
