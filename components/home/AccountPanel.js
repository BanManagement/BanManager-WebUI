import { mutate } from 'swr'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import PlayerLoginPasswordForm from '../PlayerLoginPasswordForm'
import Avatar from '../Avatar'
import Button from '../Button'
import { useUser } from '../../utils'
import PageHeader from '../PageHeader'
import Panel from '../Panel'

const AccountPanel = () => {
  const t = useTranslations()
  const { user } = useUser()
  const handleLogin = () => {
    mutate('/api/user')
  }

  return (
    <Panel>
      <PageHeader
        title={user ? user.name : t('pages.home.account.signInTitle')}
        subTitle={user ? t('pages.home.account.myAccountSubtitle') : t('pages.home.account.signInSubtitle')}
      />
      <div className='flex items-center'>
        {user
          ? (
            <div className='flex flex-col items-center w-full gap-2'>
              <Avatar type='body' height='148' width='91' uuid={user.id} />
              <Link href='/dashboard' passHref>
                <Button>{t('pages.home.account.dashboardCta')}</Button>
              </Link>
            </div>
            )
          : <PlayerLoginPasswordForm onSuccess={handleLogin} showForgotPassword />}
      </div>
    </Panel>
  )
}

export default AccountPanel
