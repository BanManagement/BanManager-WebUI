import React from 'react'
import Document, { Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render () {
    return (
      <html lang='en'>
        <Head>
          <meta charSet='utf-8' />
          <meta name='viewport' content='initial-scale=1.0, width=device-width' />
          <meta name='author' content='BanManager-WebUI' />

          <link rel='apple-touch-icon' sizes='76x76' href='/images/apple-touch-icon.png' />
          <link rel='icon' type='image/png' sizes='32x32' href='/images/favicon-32x32.png' />
          <link rel='icon' type='image/png' sizes='16x16' href='/images/favicon-16x16.png' />
          <link rel='manifest' href='/site.webmanifest' />
          <link rel='mask-icon' href='/images/safari-pinned-tab.svg' color='#5bbad5' />
          <meta name='msapplication-TileColor' content='#da532c' />
          <meta name='theme-color' content='#ffffff' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
