import { RenderCryptoBalance } from 'components/cryptoBalance'
import { RenderFiatBalance } from 'components/fiatBalance'
import { formatFiatNumber } from 'utils/format'

import { usePoolAsset } from '../_hooks/usePoolAsset'
import { useUserPoolBalance } from '../_hooks/useUserPoolBalance'

export const PoolBalance = function () {
  const poolAsset = usePoolAsset().data
  const { data: poolBalance, status } = useUserPoolBalance()

  return (
    <div className="flex flex-col">
      <span className="body-text-medium text-neutral-950">
        <RenderCryptoBalance
          balance={poolBalance}
          showSymbol
          status={status}
          token={poolAsset}
        />
      </span>
      <span className="body-text-normal text-neutral-500">
        <RenderFiatBalance
          balance={poolBalance}
          customFormatter={usd => `$ ${formatFiatNumber(usd)}`}
          queryStatus={status}
          token={poolAsset}
        />
      </span>
    </div>
  )
}
