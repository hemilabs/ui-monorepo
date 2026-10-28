import { sumInTransitSharesByShare } from '../_utils/earnRows'

import { useEarnPools } from './useEarnVaults'
import { useEarnTransactions } from './useEarnTransactions'

export const useInTransitShares = function () {
  const { data: transactions = [], isPending: isTransactionsPending } =
    useEarnTransactions()
  const { data: pools = [], isPending: isPoolsPending } = useEarnPools()

  return {
    data: sumInTransitSharesByShare(transactions, pools),
    isPending: isTransactionsPending || isPoolsPending,
  }
}
