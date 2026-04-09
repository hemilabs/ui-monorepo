export const getPortalContainer = () =>
  typeof document !== 'undefined'
    ? document.getElementById('app-layout-container') || document.body
    : null

/** Drawers portaled to `body` avoid clipping from `#app-layout-container` (`overflow-y-hidden`, `backdrop-filter`). */
export const getDrawerPortalContainer = (): HTMLElement | null =>
  typeof document !== 'undefined' ? document.body : null
