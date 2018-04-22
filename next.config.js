const withCSS = require('@zeit/next-css')

module.exports = withCSS({
  webpack(config) {
    config.module.rules.push(
    { test: /\.(png|svg|eot|otf|ttf|woff|woff2)$/
    , use:
        { loader: 'file-loader'
        , options:
          { publicPath: '/_next/static/'
          , outputPath: 'static/'
          }
        }
      }
    )

    return config
  }
})
