import { RenderCryptoBalance } from 'components/cryptoBalance'
import { TokenLogo } from 'components/tokenLogo'
import { useTranslations } from 'next-intl'
import { useAccount } from 'wagmi'

import { RenderEarnFiatBalance } from '../../../_components/earnFiatBalance'
import { usePoolForm } from '../_context/poolFormContext'
import { useUserShareValue } from '../_hooks/useUserShareValue'

export const UserPoolBalance = function () {
  const t = useTranslations()
  const { pool } = usePoolForm()
  const { isConnected } = useAccount()
  const { data, status } = useUserShareValue({
    shareAddress: pool.shareAddress,
  })

  return (
    <div className="flex flex-col gap-y-3 rounded-lg bg-neutral-50 p-4">
      <span className="text-sm font-medium text-neutral-500">
        {t('hemi-earn.pool.form.available-to-withdraw')}
      </span>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-1.5 text-base font-semibold tracking-tight text-neutral-950">
          <TokenLogo size="medium" token={pool.shareToken} />
          {isConnected ? (
            <RenderCryptoBalance
              balance={data?.shares}
              showSymbol
              skeletonWidth="wide"
              status={status}
              token={pool.shareToken}
            />
          ) : (
            <span>-</span>
          )}
        </div>
        <span className="flex items-center text-sm font-normal text-neutral-500">
          <span className="mr-0.5">$</span>
          {isConnected ? (
            <RenderEarnFiatBalance
              balance={data?.peggedAmount}
              queryStatus={status}
              token={pool.peggedToken}
            />
          ) : (
            <span>-</span>
          )}
        </span>
      </div>
    </div>
  )
}
