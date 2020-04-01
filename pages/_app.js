import App from 'next/app'
import { DefaultSeo } from 'next-seo'
import MobileDetect from 'mobile-detect'
import 'cross-fetch/polyfill'
import { GraphQLProvider } from 'graphql-react'
import { withGraphQLApp } from 'next-graphql-react'
import absoluteUrl from 'next-absolute-url'
import { GlobalStoreProvider } from '../components/GlobalContext'

// Only import what we need
import 'semantic-ui-css/components/button.css'
import 'semantic-ui-css/components/card.css'
import 'semantic-ui-css/components/checkbox.css'
import 'semantic-ui-css/components/comment.css'
import 'semantic-ui-css/components/container.css'
import 'semantic-ui-css/components/dimmer.css'
import 'semantic-ui-css/components/divider.css'
import 'semantic-ui-css/components/dropdown.css'
import 'semantic-ui-css/components/form.css'
import 'semantic-ui-css/components/grid.css'
import 'semantic-ui-css/components/header.css'
import 'semantic-ui-css/components/icon.css'
import 'semantic-ui-css/components/image.css'
import 'semantic-ui-css/components/input.css'
import 'semantic-ui-css/components/label.css'
import 'semantic-ui-css/components/menu.css'
import 'semantic-ui-css/components/message.css'
import 'semantic-ui-css/components/modal.css'
import 'semantic-ui-css/components/list.css'
import 'semantic-ui-css/components/loader.css'
import 'semantic-ui-css/components/reset.css'
import 'semantic-ui-css/components/segment.css'
import 'semantic-ui-css/components/sidebar.css'
import 'semantic-ui-css/components/site.css'
import 'semantic-ui-css/components/table.css'
import 'semantic-ui-css/components/transition.css'
import '@nateradebaugh/react-datetime/scss/styles.scss'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

class MyApp extends App {
  static async getInitialProps ({ Component, ctx }) {
    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    pageProps.origin = absoluteUrl(ctx.req).origin

    if (!ctx.req) {
      pageProps.deviceInfo = {
        mobile: false,
        tablet: false,
        os: null,
        userAgent: null
      }
    } else {
      const md = new MobileDetect(ctx.req.headers['user-agent'])
      pageProps.deviceInfo = {
        mobile: md.mobile(),
        tablet: md.tablet(),
        os: md.os(),
        userAgent: md.userAgent()
      }
    }

    if (ctx.req && !ctx.req.headers.cookie) return { pageProps }

    try {
      const origin = ctx.req && process.env.SSR_API_HOST ? process.env.SSR_API_HOST : pageProps.origin
      const response = await fetch(`${origin}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: ctx.req ? ctx.req.headers.cookie : undefined },
        credentials: 'include',
        body: JSON.stringify({
          query: `{ me {
          id
          name
          hasAccount
          session {
            type
          }
        }}`
        })
      })

      if (response.status === 200) {
        const responseData = await response.json()

        pageProps.user = responseData.data.me
        if (ctx.req) pageProps.cookie = ctx.req.headers.cookie
      }
    } catch (e) {
      console.error(e)
    }

    return { pageProps }
  }

  render () {
    const { Component, pageProps, graphql } = this.props
    const init = { user: pageProps.user || {}, cookie: pageProps.cookie, deviceInfo: pageProps.deviceInfo, origin: pageProps.origin }

    return (
      <GlobalStoreProvider initValues={init}>
        <GraphQLProvider graphql={graphql}>
          <DefaultSeo
            openGraph={{
              type: 'website',
              locale: 'en_UK',
              url: pageProps.origin,
              site_name: 'Ban Management'
            }}
          />
          <Component {...pageProps} />
        </GraphQLProvider>
      </GlobalStoreProvider>)
  }
}

export default withGraphQLApp(MyApp)
