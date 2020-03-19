import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Loader } from 'semantic-ui-react'
import Footer from './Footer'
import ResponsiveContainer from './ResponsiveContainer'
import GraphQLErrorMessage from './GraphQLErrorMessage'
import SessionNavProfile from './SessionNavProfile'
import { getWidthFactory, useApi } from '../utils'
import { GlobalStore } from '../components/GlobalContext'

function DefaultLayout ({ title = 'Default Title', children, heading, description }) {
  const store = GlobalStore()
  const user = store.get('user')
  const { mobile, tablet } = store.get('deviceInfo')
  const { loading, data } = useApi({
    query: `{
      navigation {
        left {
          id
          name
          href
        }
      }
    }`
  }, {
    loadOnReload: false,
    loadOnReset: false
  })

  if (loading) return <Loader active />
  if (!data) return <GraphQLErrorMessage error={{ networkError: true }} />

  let right = [{ icon: 'user', href: '/login' }]

  if (user.id) {
    right = [<SessionNavProfile key='session-nav-profile' />]
  }

  const { left } = data.navigation

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <NextSeo description={description} title={title} />
      <ResponsiveContainer heading={heading} leftItems={left} rightItems={right} getWidth={getWidthFactory(mobile, tablet)} mobile={mobile}>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer isMobileFromSSR={mobile} />
        </div>
      </ResponsiveContainer>
    </>
  )
}

export default withRouter(DefaultLayout)
