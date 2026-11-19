import { useTotalSupply } from '@hemilabs/react-hooks/useTotalSupply'
import { RenderFiatBalance } from 'components/fiatBalance'
import { useFormat } from 'hooks/useFormat'
import { type StakeToken } from 'types/stake'
import { type EvmToken } from 'types/token'
import { isNativeAddress } from 'utils/nativeToken'
import { getWrappedEther } from 'utils/token'
import { type Address } from 'viem'

const TokenTvl = function ({ token }: { token: EvmToken }) {
  const { formatTVL } = useFormat()
  const { data: supply, status } = useTotalSupply({
    address: token.address as Address,
    chainId: token.chainId,
  })
  return (
    <RenderFiatBalance
      balance={supply}
      customFormatter={formatTVL}
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
