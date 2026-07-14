'use client'

import { unixNowTimestamp } from 'utils/time'
import { isAddressEqual, zeroAddress } from 'viem'

import { shouldShowRemoteFailedCtas } from '../_utils'
import { decodeFailureReason } from '../_utils/decodeFailureReason'
import { type EarnTransaction } from '../types'

import { useFailedRequest } from './useFailedRequest'

export const useRemoteFailedState = function (
  transaction: EarnTransaction | undefined,
) {
  const { data: failedRequest } = useFailedRequest(transaction)
  const category = decodeFailureReason(transaction?.failureReason)
  const isStuck =
    !!failedRequest && !isAddressEqual(failedRequest.tokenIn, zeroAddress)
  return {
    category,
    show:
      !!transaction &&
      shouldShowRemoteFailedCtas({
        category,
        isStuck,
        nowSec: Number(unixNowTimestamp()),
        tx: transaction,
      }),
  }
}
