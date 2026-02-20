import { useBitcoin } from 'hooks/useBitcoin'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from './useTunnelOperation'

const RABBY_WALLET_NAME = 'Rabby Wallet'

export const useShouldShowRabbyWarningModal = function (
  toNetworkId: string | number | undefined,
): boolean {
  const bitcoin = useBitcoin()
  const { operation } = useTunnelOperation()
  const { connector } = useAccount()

  const isHemiToBitcoin =
    operation === 'withdraw' &&
    toNetworkId !== undefined &&
    toNetworkId === bitcoin.id
  const isRabbyWallet =
    connector?.name?.toLowerCase().includes(RABBY_WALLET_NAME.toLowerCase()) ??
    false

  return isHemiToBitcoin && isRabbyWallet
}
