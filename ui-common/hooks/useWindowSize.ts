import { useSyncExternalStore } from 'react'

const subscribe = function (
  callback: (this: Window, ev: WindowEventMap['resize']) => unknown,
) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

const getHeightSnapshot = () => window.innerHeight
const getWidthSnapshot = () => window.innerWidth

export const useWindowSize = function () {
  // Need to use 2 stores because the snapshot requires to be immutable
  // and using an object would create a new object on every render.
  const height = useSyncExternalStore(subscribe, getHeightSnapshot)
  const width = useSyncExternalStore(subscribe, getWidthSnapshot)

  return {
    height,
    width,
  }
}
