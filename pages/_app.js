import React from 'react'
import PropTypes from 'prop-types'
import Head from 'next/head'
import { DefaultSeo } from 'next-seo'
import 'cross-fetch/polyfill'

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

MyApp.propTypes = {
  pageProps: PropTypes.object,
  Component: PropTypes.elementType,
  graphql: PropTypes.any
}

export default MyApp
