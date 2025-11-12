import { TokenLogo } from 'components/tokenLogo'
import { Address } from 'viem'

import { usePoolAsset } from '../_hooks/usePoolAsset'

import { PoolAddress } from './poolAddress'

type Props = {
  address: Address
}
export const PoolData = function ({ address }: Props) {
  const poolAsset = usePoolAsset().data!

  return (
    <div className="flex items-center gap-x-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-neutral-50">
        <TokenLogo size="medium" token={poolAsset} version="L1" />
      </div>
      <div className="flex flex-col">
        <span className="body-text-medium text-neutral-950">
          {poolAsset.symbol}
        </span>
        <PoolAddress address={address} />
      </div>
    </div>
  )
}
