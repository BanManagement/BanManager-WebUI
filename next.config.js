const {
  PHASE_DEVELOPMENT_SERVER
} = require('next/constants')

let withBundleAnalyzer = (cfg) => cfg
if (process.env.BUNDLE_ANALYZE === 'true') {
  withBundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true })
}

const basePath = process.env.BASE_PATH || ''
let version = process.env.GIT_COMMIT || 'unknown'

if (version === 'unknown') {
  try {
    const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
    version = new GitRevisionPlugin().commithash() || 'unknown'
  } catch (e) {}
}

const nextConfig = (phase) => {
  return {
    transpilePackages: ['lodash-es'],
    modularizeImports: {
      'react-icons/?(((\\w*)?/?)*)': {
        transform: 'react-icons/{{ matches.[1] }}/index.js',
        skipDefaultConversion: true
      }
    },
    webpack (config) {
      config.module.rules.push({
        test: /\.(png|svg)$/i,
        use: [{
          loader: 'url-loader',
          options: {
            limit: 8192,
            publicPath: './',
            outputPath: 'static/css/',
            name: '[name].[ext]',
            esModule: false
          }
        }]
      })

      return config
    },
    env: {
      GIT_COMMIT: version,
      IS_DEV: (phase === PHASE_DEVELOPMENT_SERVER).toString(),
      SERVER_FOOTER_NAME: process.env.SERVER_FOOTER_NAME || 'Missing SERVER_FOOTER_NAME env var',
      BASE_PATH: basePath,
      NOTIFICATION_VAPID_PUBLIC_KEY: process.env.NOTIFICATION_VAPID_PUBLIC_KEY || 'Missing NOTIFICATION_VAPID_PUBLIC_KEY env var'
    },
    poweredByHeader: false,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'vzge.me',
          pathname: '**'
        }
      ]
    },
    basePath,
    assetPrefix: basePath
  }
}

module.exports = (phase, { defaultConfig }) => {
  const plugins = [
    withBundleAnalyzer
  ]

  return plugins.reduce((acc, plugin) => plugin(acc), { ...nextConfig(phase) })
}
