import { useEffect, useRef } from 'react'

// Calls `onFocus` whenever `isActive` becomes true
// Use this in any page that needs fresh data when navigated to
export function usePageFocus(isActive, onFocus) {
  const hasMounted = useRef(false)

  useEffect(() => {
    if (isActive) {
      // Always fetch on first mount
      // After that, only fetch when becoming active again
      onFocus()
    }
    hasMounted.current = true
  }, [isActive])
}
