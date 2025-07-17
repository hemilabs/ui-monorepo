import { useSyncExternalStore } from 'react'

const subscribe = function (
  callback: (this: VisualViewport, ev: Event) => unknown,
) {
  window.visualViewport?.addEventListener('resize', callback)
  return () => window.visualViewport?.removeEventListener('resize', callback)
}

const getHeightSnapshot = () =>
  typeof window !== 'undefined' && window.visualViewport
    ? window.visualViewport.height
    : 0

const getOffsetTopSnapshot = () =>
  typeof window !== 'undefined' && window.visualViewport
    ? window.visualViewport.offsetTop
    : 0

export const useVisualViewportSize = function () {
  // Need to use 2 stores because the snapshot requires to be immutable
  // and using an object would create a new object on every render.
  const height = useSyncExternalStore(subscribe, getHeightSnapshot)
  const offsetTop = useSyncExternalStore(subscribe, getOffsetTopSnapshot)

  return {
    height,
    offsetTop,
  }
}
