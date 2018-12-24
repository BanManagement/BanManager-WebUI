const withPlugins = require('next-compose-plugins')
const withCSS = require('@zeit/next-css')
const withTM = require('next-plugin-transpile-modules')
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer')
const nextConfig = {
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
      })

    return config
  },
  poweredByHeader: false
}

module.exports = withPlugins([ withCSS,
  [ withBundleAnalyzer,
    { analyzeServer: ["server", "both"].includes(process.env.BUNDLE_ANALYZE),
      analyzeBrowser: ["browser", "both"].includes(process.env.BUNDLE_ANALYZE),
      bundleAnalyzerConfig: {
        server: {
          analyzerMode: 'static',
          reportFilename: '../bundles/server.html'
        },
        browser: {
          analyzerMode: 'static',
          reportFilename: '../bundles/client.html'
        }
      }
    },
  ],
  [ withTM, { transpileModules: ['lodash-es'] }
  ]
], nextConfig)
