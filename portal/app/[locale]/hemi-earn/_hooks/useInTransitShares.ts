import { sumInTransitSharesByShare } from '../_utils/earnRows'

import { useEarnVaults } from './useEarnVaults'
import { useEarnTransactions } from './useEarnTransactions'

export const useInTransitShares = function () {
  const { data: transactions = [], isPending: isTransactionsPending } =
    useEarnTransactions()
  const { data: vaults = [], isPending: isVaultsPending } = useEarnVaults()

  return {
    data: sumInTransitSharesByShare(transactions, vaults),
    isPending: isTransactionsPending || isVaultsPending,
  }
}
