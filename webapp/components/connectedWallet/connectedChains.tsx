import { featureFlags } from 'app/featureFlags'
import { ConnectedBtcChain, ConnectedEvmChain } from './connectedAccount'

import { useAccounts } from 'hooks/useAccounts'

const Separator = () => <div className="h-3 w-px bg-neutral-300/55" />

export const ConnectedChains = function () {
  const { allConnected, btcWalletStatus, evmWalletStatus } = useAccounts()

  return (
    <div className="flex items-center gap-x-3">
      {evmWalletStatus === 'connected' && <ConnectedEvmChain />}
      {allConnected && <Separator />}
      {btcWalletStatus === 'connected' && featureFlags.btcTunnelEnabled && (
        <ConnectedBtcChain />
      )}
    </div>
  )
}
