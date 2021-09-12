const {
  PHASE_DEVELOPMENT_SERVER
} = require('next/constants')
const withPlugins = require('next-compose-plugins')
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
      return {
        GIT_COMMIT: new GitRevisionPlugin().commithash(),
        IS_DEV: phase === PHASE_DEVELOPMENT_SERVER
      }
    })(),
    poweredByHeader: false
  }
}

module.exports = (phase, ...rest) => {
  return withPlugins([
    [withBundleAnalyzer],
    [withTM],
  ], nextConfig(phase))(phase, ...rest)
}
