import { createMedia } from '@artsy/fresnel'

export const breakpoints = {
  mobile: 320,
  tablet: 768,
  computer: 992,
  largeScreen: 1200,
  widescreen: 1920
}

const AppMedia = createMedia({
  breakpoints
})

// Make styles for injection into the header of the page
export const mediaStyles = AppMedia.createMediaStyle()

export const { Media, MediaContextProvider } = AppMedia
