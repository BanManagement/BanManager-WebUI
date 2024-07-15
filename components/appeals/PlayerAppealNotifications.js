import { useEffect } from 'react'
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md'
import Button from '../Button'
import ErrorMessages from '../ErrorMessages'
import { useMutateApi } from '../../utils'

export default function PlayerAppealNotifications ({ appeal: { id, viewerSubscription }, onChange }) {
  const { data, loading, load, errors } = useMutateApi({
    query: /* GraphQL */ `
      mutation appealSubscriptionState($id: ID!, $subscriptionState: SubscriptionState!) {
        appealSubscriptionState(id: $id, subscriptionState: $subscriptionState) {
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
    load({ id, subscriptionState })
  }

  return (
    <div>
      <ErrorMessages errors={errors} />
      {(!viewerSubscription || viewerSubscription?.state === 'IGNORED') &&
        <>
          <Button className='bg-primary-900 text-gray-400 font-normal' loading={loading} onClick={handleChange('SUBSCRIBED')}><MdOutlineNotificationsNone className='mr-2' /> Subscribe</Button>
          <p className='text-sm text-gray-400 pt-3'>You&apos;re not receiving notifications from this appeal</p>
        </>}
      {viewerSubscription?.state === 'SUBSCRIBED' &&
        <>
          <Button className='bg-primary-900 text-gray-400 font-normal' loading={loading} onClick={handleChange('IGNORED')}><MdOutlineNotificationsOff className='mr-2' /> Unsubscribe</Button>
          <p className='text-sm text-gray-400 pt-3'>You&apos;re receiving notifications because you&apos;re watching this appeal</p>
        </>}
    </div>
  )
}
