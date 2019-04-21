import React from 'react'
import App, { Container } from 'next/app'
import MobileDetect from 'mobile-detect'
import GlobalContext from 'lib/GlobalContext'

class MyApp extends App {
  static async getInitialProps ({ Component, ctx }) {
    let pageProps = { isMobileFromSSR: false }

    if (ctx.req) {
      const md = new MobileDetect(ctx.req.headers['user-agent'])
      const isMobileFromSSR = !!md.mobile()

      pageProps = {
        isMobileFromSSR,
        deviceInfo: {
          mobile: md.mobile(),
          tablet: md.tablet(),
          os: md.os(),
          userAgent: md.userAgent()
        }
      }
    }

    if (Component.getInitialProps) {
      pageProps = { ...pageProps, ...await Component.getInitialProps(ctx) }
    }

    return { pageProps }
  }

  render () {
    const { Component, pageProps } = this.props

    return (
      <Container>
        <GlobalContext.Provider value={{ isMobileFromSSR: pageProps.isMobileFromSSR }}>
          <Component {...pageProps} />
        </GlobalContext.Provider>
      </Container>
    )
  }
}

export default MyApp
