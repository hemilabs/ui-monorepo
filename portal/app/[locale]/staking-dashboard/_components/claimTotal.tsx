import { TokenLogo } from 'components/tokenLogo'
import type { ClaimRewardTotal } from 'types/stakingDashboard'

import { useRewardTokens } from '../_hooks/useRewardTokens'
import { formatRewardAmount } from '../_utils/rewardAmount'

// One asset's figure, in the colour of whatever surface it sits on. Only the logo is
// looked up; the amount, decimals and symbol all travel with the figure, so an asset the
// token list hasn't returned yet still reads correctly - it just has no icon.
export const ClaimTotal = function ({
  className = 'text-neutral-950',
  total,
}: {
  className?: string
  total: ClaimRewardTotal
}) {
  const { tokens } = useRewardTokens()
  const token = tokens.find(
    candidate => candidate.address.toLowerCase() === total.token.toLowerCase(),
  )
  return (
    <div
      className={`flex items-center gap-x-1 text-sm font-medium ${className}`}
    >
      {token ? <TokenLogo size="xSmall" token={token} /> : null}
      <span>
        {`${formatRewardAmount({
          amount: total.claimable,
          decimals: total.decimals,
        })} ${total.symbol}`}
      </span>
    </div>
  )
}
