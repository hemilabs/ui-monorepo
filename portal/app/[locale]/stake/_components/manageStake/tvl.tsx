import { useTotalSupply } from '@hemilabs/react-hooks/useTotalSupply'
import { RenderFiatBalance } from 'components/fiatBalance'
import { type StakeToken } from 'types/stake'
import { type EvmToken } from 'types/token'
import { useLocale } from 'use-intl'
import { formatTVL } from 'utils/format'
import { isNativeAddress } from 'utils/nativeToken'
import { getWrappedEther } from 'utils/token'
import { type Address } from 'viem'

const TokenTvl = function ({ token }: { token: EvmToken }) {
  const locale = useLocale()
  const { data: supply, status } = useTotalSupply({
    address: token.address as Address,
    chainId: token.chainId,
  })
  return (
    <RenderFiatBalance
      balance={supply}
      customFormatter={amount => formatTVL(amount, locale)}
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
