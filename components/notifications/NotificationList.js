import { useState } from 'react'
import { useApi } from '../../utils'
import Loader from '../Loader'
import NotificationReportComment from './NotificationReportComment'
import NotificationReportAssigned from './NotificationReportAssigned'
import NotificationReportState from './NotificationReportState'
import NotificationAppealComment from './NotificationAppealComment'
import NotificationAppealAssigned from './NotificationAppealAssigned'
import NotificationAppealState from './NotificationAppealState'
import Pagination from '../Pagination'

const NotificationList = () => {
  const [tableState, setTableState] = useState({ activePage: 1, limit: 25, offset: 0 })
  const { loading, data } = useApi({
    query: `query listNotifications($limit: Int, $offset: Int) {
      listNotifications(limit: $limit, offset: $offset) {
        total
        records {
          id
          type
          state
          created
          report {
            id
            reason
            assignee {
              id
              name
            }
            state {
              id
              name
            }
          }
          appeal {
            id
            reason
            assignee {
              id
              name
            }
            state {
              id
              name
            }
          }
          actor {
            id
            name
          }
        }
      }
    }`,
    variables: tableState
  })

  if (loading) return <Loader />

  const handlePageChange = ({ activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * tableState.limit })
  const total = data?.listNotifications?.total || 0
  const totalPages = Math.ceil(total / tableState.limit)

  return (
    <div className='grid grid-cols-1 bg-black'>
      {!data?.listNotifications?.total
        ? 'None'
        : data?.listNotifications?.records?.map(record => {
          switch (record.type) {
            case 'reportComment':
              return <NotificationReportComment key={record.id} {...record} />
            case 'reportAssigned':
              return <NotificationReportAssigned key={record.id} {...record} />
            case 'reportState':
              return <NotificationReportState key={record.id} {...record} />
            case 'appealComment':
              return <NotificationAppealComment key={record.id} {...record} />
            case 'appealAssigned':
              return <NotificationAppealAssigned key={record.id} {...record} />
            case 'appealState':
            case 'appealEditPunishment':
            case 'appealDeletePunishment':
              return <NotificationAppealState key={record.id} {...record} />
          }

          return null
        })}
      <Pagination
        totalPages={totalPages}
        activePage={tableState.activePage}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default NotificationList
