import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { mutate } from 'swr'
import { useTranslations } from 'next-intl'
import Dropdown from './Dropdown'
import Avatar from './Avatar'
import Button from './Button'
import LanguageSwitcher from './LanguageSwitcher'
import NotificationBadge from './NotificationBadge'
import { MdOutlineNotifications, MdNotifications, MdManageAccounts, MdDashboard, MdOutlineDashboard } from 'react-icons/md'
import { useUser } from '../utils'

const buttonClassName = 'bg-primary-900 !rounded-lg p-2 transform transition duration-300 hover:scale-110 hover:bg-primary-900 w-12 h-12 items-center'

export default function SessionNavProfile ({ user, unreadNotificationCount }) {
  const router = useRouter()
  const t = useTranslations('nav')
  const tCommon = useTranslations('common')
  const tAccount = useTranslations('pages.account')
  const [loggingOut, setLoggingOut] = useState(false)
  const { hasPermission } = useUser()

  const handleLogout = async () => {
    setLoggingOut(true)

    // Using cookies for SSR instead of local storage, which are set to HttpOnly
    // requires server to delete cookie
    const response = await fetch((process.env.BASE_PATH || '') + '/api/logout',
      {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        credentials: 'include'
      })

    if (response.status !== 204) {
      setLoggingOut(false)

      const responseData = await response.json()

      throw new Error(responseData.error)
    }

    mutate('/api/user')
    router.push('/')
  }
  // Need to add login/create appeal for desktop site
  return (
    <>
      <div className='hidden md:flex gap-4'>
        <LanguageSwitcher buttonClassName={buttonClassName} />
        {hasPermission('servers', 'manage') && <Link href='/admin' passHref><Button className={buttonClassName} title={t('admin')}><MdManageAccounts /></Button></Link>}
        <Link href='/notifications' passHref>
          <Button className={buttonClassName} notificationCount={unreadNotificationCount} title={t('notifications')}>
            {router.pathname.endsWith('/notifications') ? <MdNotifications /> : <MdOutlineNotifications />}
          </Button>
        </Link>
        <Link href='/dashboard' passHref><Button className={buttonClassName} title={t('dashboard')}>{router.pathname.endsWith('/dashboard') ? <MdDashboard /> : <MdOutlineDashboard />}</Button></Link>
        <Dropdown
          trigger={({ onClickToggle }) => (
            <Button
              onClick={onClickToggle}
              className={buttonClassName}
              title={user.name}
            >
              <Avatar width='32' height='32' uuid={user.id} />
            </Button>
          )}
        >
          <Dropdown.Item name={t('account')} href='/account' />
          {!user.hasAccount && <Dropdown.Item name={tAccount('register')} href='/account/register' />}
          <Dropdown.Item name={t('profile')} href={'/player/' + user.id} />
          <div className='border-primary-400 border-b mx-1' />
          <Dropdown.Item name={tCommon('logout')} onClick={handleLogout} disabled={loggingOut} />
        </Dropdown>
      </div>
      <div className='md:hidden flex flex-col sm:flex-row sm:justify-around'>
        <Link href={'/player/' + user.id}>
          <div className='px-2 py-4 text-gray-200 flex flex-row gap-6'>
            <Avatar width='48' height='48' uuid={user.id} />
            <div>
              <div className='text-lg font-normal'>{user.name}</div>
              <div className='text-gray-400 text-sm font-normal'>{t('viewProfile')}</div>
            </div>
          </div>
        </Link>
        <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
        <Dropdown.Item name={t('account')} href='/account' className='px-2 mb-2 m-0' />
        <Dropdown.Item name={t('dashboard')} href='/dashboard' className='px-2 mb-2' />
        <Dropdown.Item name={t('notifications')} href='/notifications' className='px-2 mb-2'>
          {unreadNotificationCount > 0 && <NotificationBadge>{unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}</NotificationBadge>}
        </Dropdown.Item>
        <Dropdown.Item name={t('profile')} href={'/player/' + user.id} className='px-2 mb-2' />
        <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
        <Dropdown.Item name={tCommon('logout')} onClick={handleLogout} disabled={loggingOut} className='px-2 mb-2' />
        {hasPermission('servers', 'manage') && (
          <>
            <span className='text-5xl mb-2 border-b border-primary-400 leading-none' />
            <Dropdown.Item name={t('admin')} href='/admin' className='px-2' />
          </>)}
      </div>
    </>
  )
}
