'use client'

import { useCallback, useEffect, useState } from 'react'
import Button from '../Button'
import Modal from '../Modal'

export default function PushNotificationButton () {
  const [open, setOpen] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission)
  const setupNotifications = useCallback(async () => {
    if (!subscription) {
      try {
        const reg = await navigator.serviceWorker.ready

        const sub = await reg.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NOTIFICATION_VAPID_PUBLIC_KEY
          })

        await fetch((process.env.BASE_PATH || '') + '/api/notifications/subscribe',
          {
            method: 'POST',
            body: JSON.stringify(sub),
            headers: new Headers({ 'Content-Type': 'application/json' }),
            credentials: 'include'
          })

        setSubscription(sub)
      } catch (err) {
        console.log('Failed to subscribe the user:', err)
      }
    }
  }, [subscription, setSubscription])
  const onClickUnregisterPushNotification = useCallback(async () => {
    if (subscription) {
      await subscription.unsubscribe()

      await fetch((process.env.BASE_PATH || '') + '/api/notifications/unsubscribe',
        {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: new Headers({ 'Content-Type': 'application/json' }),
          credentials: 'include'
        })

      setSubscription(null)
    }
  }, [subscription])
  const onClickRegisterPushNotification = useCallback(() => {
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission)
      if (permission === 'granted') {
        setupNotifications()
      }
    })
  }, [setNotificationPermission, setupNotifications])
  const updateSubscription = useCallback(async () => {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()

    setSubscription(sub)
    setNotificationPermission(Notification.permission)

    if (Notification.permission !== 'denied' && open) {
      setOpen(false)
    }
  }, [open, setOpen, setSubscription])

  useEffect(() => {
    const onFocus = () => {
      updateSubscription().catch(console.error)
    }

    window.addEventListener('focus', onFocus)

    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [])
  useEffect(() => {
    updateSubscription().catch(console.error)
  }, [])

  return (
    <>
      {(notificationPermission === 'default' || (notificationPermission === 'granted' && !subscription)) &&
        <Button className='bg-primary-900 text-gray-400 font-normal w-auto' onClick={onClickRegisterPushNotification}>
          Enable push notifications
        </Button>}
      {notificationPermission === 'granted' && subscription &&
        <Button className='bg-primary-900 text-gray-400 font-normal w-auto' onClick={onClickUnregisterPushNotification}>
          Disable push notifications
        </Button>}
      {notificationPermission === 'denied' &&
        <Button className='bg-primary-900 text-gray-400 font-normal w-auto' onClick={() => setOpen(true)}>
          Enable push notifications
        </Button>}
      <Modal title='Enable Push Notifications' open={open} onCancel={() => setOpen(false)} cancelButton='Ok'>
        <div className='flex flex-col gap-4'>
          <p>Your browser is blocking notifications from this site</p>
          <p>Follow these steps to enable:</p>

          <div>
            <h3 className='font-semibold'>Chrome</h3>
            <ol className='list-decimal pl-4'>
              <li>Navigate to: <pre className='inline'>chrome://settings/content</pre></li>
              <li>Scroll down and click on the Notifications bar</li>
              <li>Find the URL of this site select allow</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>Chrome for Android</h3>
            <ol className='list-decimal pl-4'>
              <li>Select the vertical elipses icon in the top-right corner of the screen</li>
              <li>Select the “Settings” option from the dropdown menu</li>
              <li>Select the “Site settings” option</li>
              <li>Select the “Notifications” option</li>
              <li>Here you can select this website and enable notifications</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>Firefox</h3>
            <ol className='list-decimal pl-4'>
              <li>Navigate to: <pre className='inline'>about:preferences#privacy</pre></li>
              <li>Scroll down to the Permissions section</li>
              <li>Click the Settings button next to Notifications</li>
              <li>Find the URL of this site and select Allow</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>Microsoft Edge</h3>
            <ol className='list-decimal pl-4'>
              <li>Select the “...” button in the top-right corner of the browser window</li>
              <li>Select the “Settings” option from the dropdown menu</li>
              <li>Select the “Cookies and site permissions” option</li>
              <li>Select the “Notifications” option</li>
              <li>Remove this site from the “Block“ section</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>Safari</h3>
            <ol className='list-decimal pl-4'>
              <li>Select “Safari” in the action bar at the top of the screen and select “Preferences”</li>
              <li>Click on the “Websites” tab and then select “Notifications” in the menu on the left-side of the preferences window</li>
              <li>Find this site and enable notifications</li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  )
}
