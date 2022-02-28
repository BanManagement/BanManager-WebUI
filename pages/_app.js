import Head from 'next/head'
import { DefaultSeo } from 'next-seo'

import 'react-resizable/css/styles.css'
import '../styles/index.css'

function MyApp ({ Component, pageProps, graphql }) {
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
