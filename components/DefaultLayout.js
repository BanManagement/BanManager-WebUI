import React from 'react'
import Head from 'next/head'
import { withRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Loader } from 'semantic-ui-react'
import Footer from './Footer'
import ResponsiveContainer from './ResponsiveContainer'
import ErrorMessages from './ErrorMessages'
import SessionNavProfile from './SessionNavProfile'
import { useApi, useUser } from '../utils'

function DefaultLayout ({ title = 'Default Title', children, heading, description }) {
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

  if (loading && !data) return <Loader active />
  if (errors || !data) return <ErrorMessages {...errors} />

  let right = [{ icon: 'user', href: '/login' }]

  if (user?.id) {
    right = [<SessionNavProfile key='session-nav-profile' user={user} />]
  }

  const { left } = data.navigation

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <NextSeo description={description} title={title} />
      <ResponsiveContainer heading={heading} leftItems={left} rightItems={right}>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
          <div style={{ flex: 1, marginBottom: '1em' }}>
            {children}
          </div>
          <Footer />
        </div>
      </ResponsiveContainer>
    </>
  )
}

export default withRouter(DefaultLayout)
