import { Responsive } from 'semantic-ui-react'
import { useGraphQL } from 'graphql-react'
import { formatDistance, fromUnixTime } from 'date-fns'
import { version } from '../package.json'
import { GlobalStore } from '../components/GlobalContext'

export const absoluteUrl = (req, localhostAddress = 'localhost:3000') => {
  let host =
    (req?.headers ? req.headers.host : window.location.host) || localhostAddress
  let protocol = /^localhost(:\d+)?$/.test(host) ? 'http:' : 'https:'

  if (
    req &&
    req.headers['x-forwarded-host'] &&
    typeof req.headers['x-forwarded-host'] === 'string'
  ) {
    host = req.headers['x-forwarded-host']
  }

  if (
    req &&
    req.headers['x-forwarded-proto'] &&
    typeof req.headers['x-forwarded-proto'] === 'string'
  ) {
    protocol = `${req.headers['x-forwarded-proto']}:`
  }

  return {
    protocol,
    host,
    origin: protocol + '//' + host,
  }
}

export const getWidthFactory = (isMobileFromSSR, isTabletFromSSR) => () => {
  const isSSR = typeof window === 'undefined'
  let ssrValue = Responsive.onlyComputer.minWidth

  if (isMobileFromSSR) {
    ssrValue = Responsive.onlyMobile.maxWidth
  } else if (isTabletFromSSR) {
    ssrValue = Responsive.onlyTablet.minWidth
  }

  return isSSR ? ssrValue : window.innerWidth
}

export const useApi = (operation, options) => {
  const store = GlobalStore()
  const res = useGraphQL({
    operation,
    fetchOptionsOverride (options) {
      const origin = !process.browser && process.env.SSR_API_HOST ? process.env.SSR_API_HOST : store.get('origin')

      options.url = origin + '/graphql'
      options.credentials = 'include'

      const cookie = store.get('cookie')

      if (cookie) options.headers.Cookie = cookie
    },
    loadOnMount: true,
    loadOnReload: false,
    loadOnReset: false,
    ...options
  })
  const { load, loading, cacheValue: { data, ...possibleErrors } = {} } = res
  const errors = Object.keys(possibleErrors).length === 0 && possibleErrors.constructor === Object ? null : possibleErrors

  return { load, loading, errors, data }
}

export const fromNow = (timestamp) => formatDistance(fromUnixTime(timestamp), new Date(), { addSuffix: true })

export const currentVersion = () => {
  let versionStr

  if (GIT_TAG && GIT_TAG !== 'unknown') versionStr = GIT_TAG
  if (GIT_COMMIT && GIT_COMMIT !== 'unknown') versionStr = GIT_COMMIT
  if (!versionStr) versionStr = version

  return versionStr
}
