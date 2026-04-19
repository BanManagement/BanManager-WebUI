import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Modal from '../Modal'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function RoleItem ({ role, onDeleted }) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const { load, loading, errors, data } = useMutateApi({
    query: `mutation deleteRole($id: ID!) {
        deleteRole(id: $id) {
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
    await load({ id: role.id })
  }
  const handleDeleteCancel = () => setOpen(false)

  return (
    <div className='bg-black shadow-md rounded-md overflow-hidden text-center w-80' data-cy='role-item' data-cy-role={role.name}>
      <Modal
        title={t('pages.admin.roles.deleteTitle')}
        confirmButton={t('common.delete')}
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <p className='pb-1'>{t('pages.admin.roles.deleteConfirm')}</p>
        <p className='pb-1'>{t('pages.punishment.actionUndoable')}</p>
      </Modal>
      <Link href={`/admin/roles/${role.id}`} passHref>

        <div className='p-5'>
          <h5 className='text-xl font-semibold mb-2' data-cy='role-name-display'>{role.name}</h5>
        </div>
        {role.id > 3 &&
          <div className='py-3 px-5 bg-gray-900'>
            <button
              className='
                bg-red-500
                text-white
                active:bg-red-600
                font-bold
                uppercase
                text-xs
                px-4
                py-2
                rounded
                shadow
                hover:shadow-md
                outline-none
                focus:outline-none
                mr-1
                mb-1
                ease-linear
                transition-all
                duration-150
              '
              type='button'
              onClick={showConfirmDelete}
              data-cy='role-delete'
            >
              {t('common.delete')}
            </button>
          </div>}
        {role.id === '1' &&
          <div className='py-3 px-5 bg-gray-900'>
            {t('pages.admin.roles.defaultUnauthenticated')}
          </div>}
        {role.id === '2' &&
          <div className='py-3 px-5 bg-gray-900'>
            {t('pages.admin.roles.defaultAuthenticated')}
          </div>}
        {role.id === '3' &&
          <div className='py-3 px-5 bg-gray-900'>
            {t('pages.admin.roles.superAdmin')}
          </div>}

      </Link>
    </div>
  )
}
