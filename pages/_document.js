import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render () {
    return (
      <Html lang='en'>
        <Head>
          <meta charSet='utf-8' />
          <meta name='author' content='BanManager-WebUI' />

          <link rel='apple-touch-icon' sizes='76x76' href={process.env.BASE_PATH + '/images/apple-touch-icon.png'} />
          <link rel='icon' type='image/png' sizes='32x32' href={process.env.BASE_PATH + '/images/favicon-32x32.png'} />
          <link rel='icon' type='image/png' sizes='16x16' href={process.env.BASE_PATH + '/images/favicon-16x16.png'} />
          <link rel='manifest' href={process.env.BASE_PATH + '/site.webmanifest'} />
          <link rel='mask-icon' href={process.env.BASE_PATH + '/images/safari-pinned-tab.svg'} color='#5bbad5' />
          <meta name='msapplication-TileColor' content='#da532c' />
          <meta name='theme-color' content='#ffffff' />

          <link
            href='https://fonts.googleapis.com/css2?family=Inter&display=optional'
            rel='stylesheet'
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
