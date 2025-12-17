import { useState } from 'react'
import Loader from '../../components/Loader'
import ErrorLayout from '../../components/ErrorLayout'
import AdminLayout from '../../components/AdminLayout'
import { useApi } from '../../utils'
import AdminHeader from '../../components/admin/AdminHeader'
import DocumentsTable from '../../components/admin/DocumentsTable'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import { FiImage } from 'react-icons/fi'

const LIMIT = 25

export default function Page () {
  const [tableState, setTableState] = useState({ offset: 0, player: null, dateStart: null, dateEnd: null })
  const { loading, data, errors, mutate } = useApi({
    query: `query listDocuments($limit: Int, $offset: Int, $player: UUID, $dateStart: Timestamp, $dateEnd: Timestamp) {
      listDocuments(limit: $limit, offset: $offset, player: $player, dateStart: $dateStart, dateEnd: $dateEnd) {
        total
        records {
          id
          filename
          mimeType
          size
          width
          height
          created
          player {
            id
            name
          }
          usages {
            type
            id
            commentId
            serverId
            label
          }
          acl {
            delete
          }
        }
      }
    }`,
    variables: { limit: LIMIT, ...tableState }
  })

  const handlePageChange = (page) => {
    setTableState(prev => ({ ...prev, offset: (page - 1) * LIMIT }))
  }

  const handleDelete = (docId) => {
    const records = data.listDocuments.records.filter(d => d.id !== docId)
    mutate({ ...data, listDocuments: { ...data.listDocuments, total: data.listDocuments.total - 1, records } }, false)
  }

  if (loading) return <AdminLayout title='Loading...'><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const total = data?.listDocuments?.total || 0
  const records = data?.listDocuments?.records || []
  const totalPages = Math.ceil(total / LIMIT)
  const currentPage = Math.floor(tableState.offset / LIMIT) + 1

  return (
    <AdminLayout title='Documents'>
      <AdminHeader title='Documents'>
        <div className='text-gray-400 text-sm'>
          {total} document{total === 1 ? '' : 's'} uploaded
        </div>
      </AdminHeader>
      <div className='lg:col-span-3'>
        {records.length > 0
          ? (
            <>
              <DocumentsTable documents={records} onDelete={handleDelete} />
              {totalPages > 1 && (
                <div className='mt-6 flex justify-center'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
            )
          : (
            <EmptyState
              title='No documents uploaded'
              subTitle='Documents attached to appeals and reports will appear here'
            >
              <FiImage className='w-12 h-12 text-gray-500 mx-auto' />
            </EmptyState>
            )}
      </div>
    </AdminLayout>
  )
}
