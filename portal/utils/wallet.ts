import { UseAccountReturnType } from 'wagmi'

// When navigating between routes, Wagmi can briefly report 'reconnecting' even if the wallet is already connected.
// We consider both 'connected' and 'reconnecting' as valid states to indicate that a wallet is connected.
// 'connecting' is intentionally excluded to avoid false positives when no wallet is actually connected.
export const walletIsConnected = (status: UseAccountReturnType['status']) =>
  ['connected', 'reconnecting'].includes(status)
