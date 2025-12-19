export const getPortalContainer = () =>
  typeof document !== 'undefined'
    ? document.getElementById('app-layout-container') || document.body
    : null
