const withPlugins = require('next-compose-plugins')
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.BUNDLE_ANALYZE === 'true'
})
const withTM = require('next-transpile-modules')(['lodash-es'])
const { withGraphQLConfig } = require('next-graphql-react/server')

const nextConfig = {
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
  poweredByHeader: false
}

module.exports = withPlugins([
  [withBundleAnalyzer],
  [withTM],
  [withGraphQLConfig]
], nextConfig)
