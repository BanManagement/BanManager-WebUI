import Document, { Html, Head, Main, NextScript } from 'next/document'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../tailwind.config'
import { LOCALE_CONFIG, DEFAULT_LOCALE, negotiateLocaleFromRequest } from '../utils/locale'

const fullConfig = resolveConfig(tailwindConfig)

export default class MyDocument extends Document {
  static async getInitialProps (ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    const locale = ctx.req
      ? negotiateLocaleFromRequest(ctx.req)
      : DEFAULT_LOCALE

    return { ...initialProps, locale }
  }

  render () {
    const locale = this.props.locale || DEFAULT_LOCALE
    const htmlLang = LOCALE_CONFIG[locale]?.htmlLang || LOCALE_CONFIG[DEFAULT_LOCALE].htmlLang

    return (
      // Avoid FOUC by setting a background color that matches the theme
      <Html lang={htmlLang} style={{ background: fullConfig.theme.colors.primary['500'] }}>
        <Head>
          <meta charSet='utf-8' />
          <meta name='author' content='BanManager-WebUI' />

          <link rel='apple-touch-icon' sizes='76x76' href={(process.env.BASE_PATH || '') + '/images/apple-touch-icon.png'} />
          <link rel='icon' type='image/png' sizes='32x32' href={(process.env.BASE_PATH || '') + '/images/favicon-32x32.png'} />
          <link rel='icon' type='image/png' sizes='16x16' href={(process.env.BASE_PATH || '') + '/images/favicon-16x16.png'} />
          <link rel='manifest' href={(process.env.BASE_PATH || '') + '/site.webmanifest'} />
          <link rel='mask-icon' href={(process.env.BASE_PATH || '') + '/images/safari-pinned-tab.svg'} color='#5bbad5' />
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
