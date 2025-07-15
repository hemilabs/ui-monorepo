import { useState } from 'react'

export function useHasScrolled() {
  const [hasScrolled, setHasScrolled] = useState(false)

  function onScroll(e: React.UIEvent<HTMLElement>) {
    const isScrolled = e.currentTarget.scrollTop > 0

    if (isScrolled !== hasScrolled) {
      setHasScrolled(isScrolled)
    }
  }

  return { hasScrolled, onScroll }
}
