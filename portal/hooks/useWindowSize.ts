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
  // Passing 0 to the snapshot function as we are not using ssr.
  const height = useSyncExternalStore(subscribe, getHeightSnapshot, () => 0)
  const width = useSyncExternalStore(subscribe, getWidthSnapshot, () => 0)

  return {
    height,
    width,
  }
}
