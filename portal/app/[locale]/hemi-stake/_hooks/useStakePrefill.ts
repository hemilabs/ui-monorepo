import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'

import { parseStakePrefill } from '../_utils/stakePrefill'

export const useStakePrefill = function () {
  const [amount] = useQueryState('amount', parseAsString)
  const [lockupDays] = useQueryState('lockupDays', parseAsInteger)

  return parseStakePrefill({ amount, lockupDays })
}
