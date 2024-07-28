import { useEffect, useMemo } from 'react'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import Favicon from 'react-favicon'
import { MdLogin } from 'react-icons/md'
import Footer from './Footer'
import Nav from './Nav'
import SessionNavProfile from './SessionNavProfile'
import PlayerSelector from './admin/PlayerSelector'
import { useApi, useUser } from '../utils'
import { useRouter, withRouter } from 'next/router'
import Loader from './Loader'
import Button from './Button'
import Link from 'next/link'

const query = `query unreadNotificationCount {
  unreadNotificationCount
}`

const LoggedOutNav = () => (
  <div className='hidden md:flex gap-4'>
    <Link href='/login' passHref>
      <Button className='text-sm'>
        <MdLogin className='mr-2' /> Login
      </Button>
    </Link>
  </div>
)

function DefaultLayout ({ title = 'Default Title', children, description, loading }) {
  const { user } = useUser()
  const { data } = useApi({ query: user?.id ? query : null }, { refreshInterval: 10000, refreshWhenHidden: true })
  const router = useRouter()

  useEffect(() => {
    if (data) {
      const title = document.title

      if (/\([\d]+\)/.test(title)) {
        const titleStart = title.indexOf(')') + 1

        if (data.unreadNotificationCount === 0) {
          document.title = title.substring(titleStart)
        } else {
          const currentCount = parseInt(title.substring(1, title.indexOf(')')), 10)

          if (data.unreadNotificationCount !== currentCount) {
            document.title = `(${data.unreadNotificationCount}) ${title.substring(titleStart)}`
          }
        }
      } else if (data.unreadNotificationCount !== 0) {
        document.title = `(${data.unreadNotificationCount}) ${title}`
      }
    }
  }, [data])

  const left = [
    <div key='nav-search' className='w-2/3 md:w-full justify-center'>
      <PlayerSelector
        multiple={false}
        onChange={(id) => id ? router.push(`/player/${id}`) : undefined}
        placeholder='Search player'
      />
    </div>]
  const right = useMemo(() => user?.id ? [<SessionNavProfile key='session-nav-profile' user={user} unreadNotificationCount={data?.unreadNotificationCount} />] : [<LoggedOutNav key='nav-logged-out' />], [user, data])
  const mobileItems = useMemo(() => !user?.id ? [{ name: 'Login', href: '/login' }, { name: 'Create Appeal', href: '/appeal' }] : [], [user])

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <NextSeo
        description={description} title={title} openGraph={{
          title,
          description
        }}
      />
      <BodyWrapper>
        <Favicon
          url='/images/favicon-32x32.png'
          faviconSize={32}
          alertCount={data?.unreadNotificationCount || null}
          animated={false}
        />
        <Nav leftItems={left} rightItems={right} mobileItems={mobileItems} unreadNotificationCount={data?.unreadNotificationCount || null} />
        <div className='flex-grow text-gray-200 bg-primary-500 pb-12 relative'>
          {loading ? <Loader className='-mt-32' /> : children}
        </div>
        <Footer />
      </BodyWrapper>
    </>
  )
}

const BodyWrapper = ({ children }) => <div className='flex flex-col h-screen font-primary bg-primary-500'>{children}</div>

export default withRouter(DefaultLayout)
