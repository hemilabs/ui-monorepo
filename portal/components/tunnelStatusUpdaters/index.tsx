import { BitcoinDepositsStatusUpdater } from './bitcoinDepositsStatusUpdater'
import { BitcoinWithdrawalsStatusUpdater } from './bitcoinWithdrawalsStatusUpdater'
import { EvmDepositsStatusUpdater } from './evmDepositsStatusUpdater'
import { EvmWithdrawalsStateUpdater } from './evmWithdrawalsStateUpdater'

export const TunnelStatusUpdaters = () => (
  <>
    {/* Track updates on bitcoin deposits, in bitcoin or in Hemi */}
    <BitcoinDepositsStatusUpdater />
    {/* Track updates on bitcoin withdrawals, from Hemi to Bitcoin */}
    <BitcoinWithdrawalsStatusUpdater />
    {/* Track updates on evm withdrawals from Hemi */}
    <EvmWithdrawalsStateUpdater />
    {/* Track updates on deposits to Hemi, tracking any missing info */}
    <EvmDepositsStatusUpdater />
  </>
)
