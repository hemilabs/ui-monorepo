export const getPortalContainer = () =>
  typeof document !== 'undefined'
    ? document.getElementById('app-layout-container') || document.body
    : null

export const getDrawerPortalContainer = (): HTMLElement | null =>
  typeof document !== 'undefined' ? document.body : null
