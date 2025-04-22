import { useAccount as useBtcAccount } from 'btc-wallet/hooks/useAccount'
import { useAccount as useEvmAccount } from 'wagmi'

export const useAccounts = function () {
  const btcAccount = useBtcAccount()
  const evmAccount = useEvmAccount()

  return {
    allConnected: btcAccount.isConnected && evmAccount.isConnected,
    allDisconnected: btcAccount.isDisconnected && evmAccount.isDisconnected,
    btcAddress: btcAccount.address,
    btcChainId: btcAccount.chainId,
    btcWalletStatus: btcAccount.status,
    evmAddress: evmAccount.address,
    evmChainId: evmAccount.chainId,
    evmWalletStatus: evmAccount.status,
  }
}
