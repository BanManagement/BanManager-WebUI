import { Responsive } from 'semantic-ui-react'

const getWidthFactory = isMobileFromSSR => () => {
  const isSSR = typeof window === 'undefined'
  const ssrValue = isMobileFromSSR
    ? Responsive.onlyMobile.maxWidth
    : Responsive.onlyTablet.minWidth

  return isSSR ? ssrValue : window.innerWidth
}

export default getWidthFactory
