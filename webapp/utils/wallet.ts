import { UseAccountReturnType } from 'wagmi'

// When navigating across pages, wagmi performs an automatic reconnection. Depending on the previous step
// status may be one of these 3. For smoother UX, when checking for "isConnected", use this util instead of the "isConnected" flag
// exported from useAccount.
export const walletIsConnected = (status: UseAccountReturnType['status']) =>
  ['connected', 'connecting', 'reconnecting'].includes(status)
