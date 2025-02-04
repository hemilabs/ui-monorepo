import { Balance } from 'components/balance'
import { StakeToken } from 'types/stake'

type Props = {
  token: StakeToken
}

export const WalletBalance = ({ token }: Props) => (
  <div className="flex flex-col justify-end">
    <span className="text-neutral-950">
      <Balance token={token} />
    </span>
    <p className="text-neutral-500">
      <span className="mr-1">$</span>
      {/* TODO - TBD how to calculate monetaryValue - https://github.com/hemilabs/ui-monorepo/issues/796 */}
      125
    </p>
  </div>
)
