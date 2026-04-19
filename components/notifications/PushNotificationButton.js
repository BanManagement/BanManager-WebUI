'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Button from '../Button'
import Modal from '../Modal'

export default function PushNotificationButton () {
  const t = useTranslations('widgets.pushNotifications')
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
          {t('enable')}
        </Button>}
      {notificationPermission === 'granted' && subscription &&
        <Button className='bg-primary-900 text-gray-400 font-normal w-auto' onClick={onClickUnregisterPushNotification}>
          {t('disable')}
        </Button>}
      {notificationPermission === 'denied' &&
        <Button className='bg-primary-900 text-gray-400 font-normal w-auto' onClick={() => setOpen(true)}>
          {t('enable')}
        </Button>}
      <Modal title={t('blockedTitle')} open={open} onCancel={() => setOpen(false)} cancelButton={t('ok')}>
        <div className='flex flex-col gap-4'>
          <p>{t('blockedIntro')}</p>
          <p>{t('blockedSteps')}</p>

          <div>
            <h3 className='font-semibold'>{t('chrome')}</h3>
            <ol className='list-decimal pl-4'>
              <li>{t.rich('chromeStep1', { path: (chunks) => <pre className='inline'>{chunks}</pre> })}</li>
              <li>{t('chromeStep2')}</li>
              <li>{t('chromeStep3')}</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>{t('chromeAndroid')}</h3>
            <ol className='list-decimal pl-4'>
              <li>{t('chromeAndroidStep1')}</li>
              <li>{t('chromeAndroidStep2')}</li>
              <li>{t('chromeAndroidStep3')}</li>
              <li>{t('chromeAndroidStep4')}</li>
              <li>{t('chromeAndroidStep5')}</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>{t('firefox')}</h3>
            <ol className='list-decimal pl-4'>
              <li>{t.rich('firefoxStep1', { path: (chunks) => <pre className='inline'>{chunks}</pre> })}</li>
              <li>{t('firefoxStep2')}</li>
              <li>{t('firefoxStep3')}</li>
              <li>{t('firefoxStep4')}</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>{t('edge')}</h3>
            <ol className='list-decimal pl-4'>
              <li>{t('edgeStep1')}</li>
              <li>{t('edgeStep2')}</li>
              <li>{t('edgeStep3')}</li>
              <li>{t('edgeStep4')}</li>
              <li>{t('edgeStep5')}</li>
            </ol>
          </div>

          <div>
            <h3 className='font-semibold'>{t('safari')}</h3>
            <ol className='list-decimal pl-4'>
              <li>{t('safariStep1')}</li>
              <li>{t('safariStep2')}</li>
              <li>{t('safariStep3')}</li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  )
}
