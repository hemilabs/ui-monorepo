import { Dispatch, useEffect } from 'react'
import { isL2NetworkId } from 'utils/chain'
import { Chain } from 'viem'

import { HistoryActions, HistoryReducerState } from './types'

export const usePollHistory = function ({
  chainId,
  history,
  dispatch,
}: {
  chainId: Chain['id']
  history: HistoryReducerState
  dispatch: Dispatch<HistoryActions>
}) {
  const operations = isL2NetworkId(chainId)
    ? history.withdrawals
    : history.deposits

  const status = operations.find(op => op.chainId === chainId)?.status
  useEffect(
    function poll() {
      // worker is still running, do nothing.
      if (!['ready', 'syncing'].includes(status)) {
        return undefined
      }
      // force spin up of worker to bring new operations
      const intervalId = setInterval(
        () => dispatch({ payload: { chainId }, type: 'sync' }),
        // every 2 minutes
        1000 * 60 * 2,
      )

      return () => clearInterval(intervalId)
    },
    [chainId, status, dispatch],
  )
}
