import { RenderFiatBalance } from 'components/fiatBalance'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { StakeToken } from 'types/stake'

export const Tvl = function ({ token }: { token: StakeToken }) {
  const {
    data: supply,
    fetchStatus,
    status,
  } = useTotalSupply(token.address, token.chainId)
  return (
    <RenderFiatBalance
      balance={supply}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}
