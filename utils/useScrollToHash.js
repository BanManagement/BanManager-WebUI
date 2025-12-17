import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Scrolls to an element matching the URL hash after data loads.
 * Uses double requestAnimationFrame to ensure DOM is fully painted.
 * @param {boolean} isReady - Whether the data/content is ready to scroll to
 */
export function useScrollToHash (isReady) {
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return

    const hash = router.asPath.split('#')[1]
    if (!hash) return

    // Wait for DOM to fully paint before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const element = document.getElementById(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
    })
  }, [isReady, router.asPath])
}
