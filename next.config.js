const {
  PHASE_DEVELOPMENT_SERVER
} = require('next/constants')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.BUNDLE_ANALYZE === 'true'
})
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')

const basePath = process.env.BASE_PATH || ''
let version = 'unknown'

try {
  version = new GitRevisionPlugin().commithash() || 'unknown'
} catch (e) {}

const nextConfig = (phase) => {
  return {
    transpilePackages: ['lodash-es'],
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
      BASE_PATH: basePath
    },
    poweredByHeader: false,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'crafatar.com',
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
