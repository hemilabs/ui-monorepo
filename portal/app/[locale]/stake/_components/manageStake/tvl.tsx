import { RenderFiatBalance } from 'components/fiatBalance'
import { useTotalSupply } from 'hooks/useTotalSupply'
import { type StakeToken } from 'types/stake'
import { type EvmToken } from 'types/token'
import { formatTVL } from 'utils/format'
import { isNativeAddress } from 'utils/nativeToken'
import { getWrappedEther } from 'utils/token'

const TokenTvl = function ({ token }: { token: EvmToken }) {
  const {
    data: supply,
    fetchStatus,
    status,
  } = useTotalSupply(token.address, token.chainId)
  return (
    <RenderFiatBalance
      balance={supply}
      customFormatter={formatTVL}
      fetchStatus={fetchStatus}
      queryStatus={status}
      token={token}
    />
  )
}

const EthTvl = function ({ token }: { token: EvmToken }) {
  // For ETH, we use the WETH supply instead
  const wrappedToken = getWrappedEther(token.chainId)

  return <TokenTvl token={wrappedToken} />
}

export const Tvl = ({ token }: { token: StakeToken }) =>
  isNativeAddress(token.address) ? (
    <EthTvl token={token} />
  ) : (
    <TokenTvl token={token} />
  )
