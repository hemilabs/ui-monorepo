import { RenderCryptoBalance } from 'components/cryptoBalance'
import { useHemi } from 'hooks/useHemi'
import { useToken } from 'hooks/useToken'
import Skeleton from 'react-loading-skeleton'
import type { Address } from 'viem'

const TokenRewardItem = function ({
  address,
  amount,
}: {
  address: Address
  amount: bigint
}) {
  const hemi = useHemi()
  const { data: token, isError } = useToken({
    address,
    // Rewards are on Hemi chain.
    chainId: hemi.id,
  })

  if (isError) {
    return null
  }

  if (token === undefined) {
    return <Skeleton className="h-full" containerClassName="basis-1/4" />
  }

  return (
    <RenderCryptoBalance
      balance={amount}
      fetchStatus="idle"
      showSymbol
      status="success"
      token={token}
    />
  )
}

export const Rewards = function ({
  amounts,
  tokenAddresses,
}: {
  amounts: bigint[]
  tokenAddresses: Address[]
}) {
  if (tokenAddresses.length === 0) {
    return <span>-</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {tokenAddresses.map((address, index) => (
        <span className="flex items-center gap-x-1" key={address}>
          <TokenRewardItem address={address} amount={amounts[index]} />
          {tokenAddresses.length > 1 && index < tokenAddresses.length - 1 && (
            <span>+</span>
          )}
        </span>
      ))}
    </div>
  )
}
