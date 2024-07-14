import { useEffect } from 'react'
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md'
import Button from '../Button'
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

  return (
    <div>
      <ErrorMessages errors={errors} />
      {(!viewerSubscription || viewerSubscription?.state === 'IGNORED') &&
        <>
          <Button className='bg-primary-900 text-gray-400 font-normal' loading={loading} onClick={handleChange('SUBSCRIBED')}><MdOutlineNotificationsNone className='mr-2' /> Subscribe</Button>
          <p className='text-sm text-gray-400 pt-3'>You&apos;re not receiving notifications from this report</p>
        </>}
      {viewerSubscription?.state === 'SUBSCRIBED' &&
        <>
          <Button className='bg-primary-900 text-gray-400 font-normal' loading={loading} onClick={handleChange('IGNORED')}><MdOutlineNotificationsOff className='mr-2' /> Unsubscribe</Button>
          <p className='text-sm text-gray-400 pt-3'>You&apos;re receiving notifications because you&apos;re watching this report</p>
        </>}
    </div>
  )
}
