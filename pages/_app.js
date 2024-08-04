import Head from 'next/head'
import { DefaultSeo } from 'next-seo'

import '../styles/index.css'
import { useEffect } from 'react'

function MyApp ({ Component, pageProps, graphql }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => {
          console.error('Service worker registration failed', error)
        })
    }
  }, [])

  return (
    <>
      <Head>
        <meta name='viewport' content='initial-scale=1.0, width=device-width' />
      </Head>
      <DefaultSeo
        openGraph={{
          type: 'website',
          locale: 'en_UK',
          url: pageProps.origin,
          site_name: 'Ban Management'
        }}
      />
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
