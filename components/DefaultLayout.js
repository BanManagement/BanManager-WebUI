import Head from 'next/head'
import { withRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import Loader from './Loader'
import Footer from './Footer'
import Nav from './Nav'
import ErrorMessages from './ErrorMessages'
import SessionNavProfile from './SessionNavProfile'
import { useApi, useUser } from '../utils'

function DefaultLayout ({ title = 'Default Title', children, description }) {
  const { user } = useUser()
  const { loading, data, errors } = useApi({
    query: `{
      navigation {
        left {
          id
          name
          href
        }
      }
    }`
  })

  if (loading && !data) return <BodyWrapper><Loader /></BodyWrapper>
  if (errors || !data) return <BodyWrapper><ErrorMessages errors={errors} /></BodyWrapper>

  let right = []

  if (user?.id) {
    right = [<SessionNavProfile key='session-nav-profile' user={user} />]
  }

  const { left } = data.navigation

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
        <Nav leftItems={left} mobileItems={left} rightItems={right} />
        <div className='flex-grow text-white bg-primary-500 pb-12'>
          {children}
        </div>
        <Footer />
      </BodyWrapper>
    </>
  )
}

const BodyWrapper = ({ children }) => <div className='flex flex-col h-screen font-primary bg-primary-500'>{children}</div>

export default withRouter(DefaultLayout)
