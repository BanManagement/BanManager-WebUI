const {
  PHASE_DEVELOPMENT_SERVER
} = require('next/constants')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.BUNDLE_ANALYZE === 'true'
})
const withTM = require('next-transpile-modules')(['lodash-es'])
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')

const nextConfig = (phase) => {
  return {
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
    env: (() => {
      let version = 'unknown'

      try {
        version = new GitRevisionPlugin().commithash()
      } catch (e) {}

      return {
        GIT_COMMIT: version,
        IS_DEV: phase === PHASE_DEVELOPMENT_SERVER,
        SERVER_FOOTER_NAME: process.env.SERVER_FOOTER_NAME || 'Missing SERVER_FOOTER_NAME env var'
      }
    })(),
    poweredByHeader: false,
    images: {
      domains: ['crafatar.com']
    }
  }
}

module.exports = (phase, { defaultConfig }) => {
  const plugins = [
    withBundleAnalyzer,
    withTM
  ]

  return plugins.reduce((acc, plugin) => plugin(acc), { ...nextConfig(phase) })
}
