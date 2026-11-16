import { useMemo } from 'react'

import { getExtendedLockEnd, getExtendForecast } from '../_utils/extendForecast'
import { earnsAnotherEpoch } from '../_utils/topUpForecast'

import { usePositionForecastInputs } from './usePositionForecastInputs'

export const useExtendForecast = function ({
  lockupDays,
  tokenId,
}: {
  lockupDays: number
  tokenId: bigint | undefined
}) {
  const { inputsByClass, lockEnd, now, position, positionClass, ...rest } =
    usePositionForecastInputs(tokenId)

  const extendedLockEnd = getExtendedLockEnd({ lockupDays, now })
  const isExtension = lockEnd !== undefined && extendedLockEnd > lockEnd

  const forecast = useMemo(
    function () {
      if (
        !isExtension ||
        lockEnd === undefined ||
        position === undefined ||
        positionClass === undefined ||
        inputsByClass === undefined
      ) {
        return undefined
      }

      return getExtendForecast({
        inputsByClass,
        lockupDays,
        now,
        position: { amount: position.amount, lockEnd, positionClass },
      })
    },
    [
      inputsByClass,
      isExtension,
      lockEnd,
      lockupDays,
      now,
      position,
      positionClass,
    ],
  )

  return {
    ...rest,
    earnsAnotherEpoch:
      lockEnd === undefined
        ? undefined
        : earnsAnotherEpoch({ lockEnd: extendedLockEnd, now }),
    forecast,
    hasValidLockup: isExtension,
    lockEnd: extendedLockEnd,
  }
}
