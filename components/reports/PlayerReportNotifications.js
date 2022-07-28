import { useEffect } from 'react'
import { MdNotifications, MdNotificationsOff } from 'react-icons/md'
import Button from '../Button'
import Loader from '../Loader'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'

export default function PlayerReportNotifications ({ report: { id, viewerSubscription }, server, onChange }) {
  const { data, loading, load, errors } = useMutateApi({
    query: /* GraphQL */ `
      mutation reportSubscriptionState($report: ID!, $serverId: ID!, $subscriptionState: SubscriptionState!) {
        reportSubscriptionState(report: $report, serverId: $serverId, subscriptionState: $subscriptionState) {
          state
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].state)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (subscriptionState) => () => {
    load({ serverId: server.id, report: id, subscriptionState })
  }

  if (loading) return <Loader />

  return (
    <div>
      <ErrorMessages errors={errors} />
      {(!viewerSubscription || viewerSubscription?.state === 'IGNORED') &&
        <>
          <Button loading={loading} onClick={handleChange('SUBSCRIBED')}><MdNotifications className='text-xl mr-2' /> Subscribe</Button>
          <p className='text-sm text-gray-300 pt-3'>You&apos;re not receiving notifications from this report</p>
        </>}
      {viewerSubscription?.state === 'SUBSCRIBED' &&
        <>
          <Button loading={loading} onClick={handleChange('IGNORED')}><MdNotificationsOff className='text-xl mr-2' /> Unsubscribe</Button>
          <p className='text-sm text-gray-300 pt-3'>You&apos;re receiving notifications because you&apos;re watching this report</p>
        </>}
    </div>
  )
}
