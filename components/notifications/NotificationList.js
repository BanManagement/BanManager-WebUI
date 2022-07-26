import { useState } from 'react'
import { useApi } from '../../utils'
import NotificationReportComment from './NotificationReportComment'
import Loader from '../Loader'
import NotificationReportAssigned from './NotificationReportAssigned'
import NotificationReportState from './NotificationReportState'

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
          }

          return null
        })
      }
    </div>
  )
}

export default NotificationList
