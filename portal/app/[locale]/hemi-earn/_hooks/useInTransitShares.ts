import { sumInTransitSharesByShare } from '../_utils/earnRows'

import { useEarnTransactions } from './useEarnTransactions'
import { useEarnVaults } from './useEarnVaults'

export const useInTransitShares = function () {
  const { data: transactions = [], isPending: isTransactionsPending } =
    useEarnTransactions()
  const { data: vaults = [], isPending: isVaultsPending } = useEarnVaults()

  return {
    data: sumInTransitSharesByShare(transactions, vaults),
    isPending: isTransactionsPending || isVaultsPending,
  }
}
