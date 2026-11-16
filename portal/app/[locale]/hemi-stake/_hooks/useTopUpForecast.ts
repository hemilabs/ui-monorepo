import { useMemo } from 'react'

import { earnsAnotherEpoch, getTopUpForecast } from '../_utils/topUpForecast'

import { usePositionForecastInputs } from './usePositionForecastInputs'

export const useTopUpForecast = function ({
  addedAmount,
  tokenId,
}: {
  addedAmount: bigint
  tokenId: bigint | undefined
}) {
  const { inputsByClass, lockEnd, now, position, positionClass, ...rest } =
    usePositionForecastInputs(tokenId)

  const forecast = useMemo(
    function () {
      if (
        position === undefined ||
        lockEnd === undefined ||
        positionClass === undefined ||
        inputsByClass === undefined
      ) {
        return undefined
      }

      return getTopUpForecast({
        addedAmount,
        inputsByClass,
        now,
        position: { amount: position.amount, lockEnd, positionClass },
      })
    },
    [addedAmount, inputsByClass, lockEnd, now, position, positionClass],
  )

  return {
    ...rest,
    earnsAnotherEpoch:
      lockEnd === undefined ? undefined : earnsAnotherEpoch({ lockEnd, now }),
    forecast,
    hasValidLockup: lockEnd !== undefined,
    lockEnd,
  }
}
