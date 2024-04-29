import { useState, useEffect } from 'react'

/**
 * Custom hook to listen for changes in media query.
 *
 * @param {string} query - The media query to listen for.
 * @returns {boolean} - Returns true if the media query matches, otherwise false.
 */
export function useMediaQuery(query: string): boolean {
  /**
   * Function to check if the media query matches the current state of the document.
   *
   * @param {string} query - The media query to check.
   * @returns {boolean} - Returns true if the media query matches, otherwise false.
   */
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  }

  const [matches, setMatches] = useState<boolean>(getMatches(query))

  function handleChange() {
    setMatches(getMatches(query))
  }

  useEffect(() => {
    const matchMedia = window.matchMedia(query)

    // Triggered at the first client-side load and if query changes
    handleChange()

    // Listen matchMedia using modern event listener method
    matchMedia.addEventListener('change', handleChange)

    return () => {
      // Clean up using modern event listener removal method
      matchMedia.removeEventListener('change', handleChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return matches
}
