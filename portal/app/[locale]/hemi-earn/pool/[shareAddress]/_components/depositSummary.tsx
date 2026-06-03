import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { useTranslations } from 'next-intl'
import { type ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type EvmToken } from 'types/token'
import { formatUnits } from 'viem'

const Row = ({ children, label }: { children: ReactNode; label: string }) => (
  <div className="flex items-center justify-between text-sm font-medium">
    <span className="text-neutral-500">{label}</span>
    {children}
  </div>
)

type FeeRowProps = {
  amount: bigint
  isError: boolean
  label: string
  token: EvmToken
}

const FeeRow = function ({ amount, isError, label, token }: FeeRowProps) {
  const formatted = formatUnits(amount, token.decimals)

  if (!isError && formatted !== '0') {
    return (
      <Row label={label}>
        <DisplayAmount amount={formatted} showTokenLogo={false} token={token} />
      </Row>
    )
  }
  if (isError) {
    return (
      <Row label={label}>
        <span className="text-neutral-950">-</span>
      </Row>
    )
  }
  return (
    <Row label={label}>
      <Skeleton className="w-12" />
    </Row>
  )
}

type SharesRowProps = {
  shareToken: EvmToken
  shares: bigint | undefined
}

const SharesRow = function ({ shares, shareToken }: SharesRowProps) {
  const t = useTranslations()
  const label = t('hemi-earn.pool.form.you-will-receive')

  if (shares !== undefined) {
    return (
      <Row label={label}>
        <div className="flex items-center gap-x-1 text-neutral-950">
          <DisplayAmount
            amount={formatUnits(shares, shareToken.decimals)}
            showTokenLogo={false}
            token={shareToken}
          />
          <div className="shadow-bs rounded-full">
            <TokenLogo size="small" token={shareToken} />
          </div>
        </div>
      </Row>
    )
  }
  return (
    <Row label={label}>
      <Skeleton className="w-16" />
    </Row>
  )
}

type Props = {
  ethereumGasFee: bigint
  isFeesError: boolean
  nativeToken: EvmToken
  networkFee: bigint
  shareToken: EvmToken
  shares: bigint | undefined
  totalFees: bigint
}

export const DepositSummary = function ({
  ethereumGasFee,
  isFeesError,
  nativeToken,
  networkFee,
  shares,
  shareToken,
  totalFees,
}: Props) {
  const t = useTranslations()
  return (
    <div className="flex flex-col gap-y-2.5">
      <SharesRow shareToken={shareToken} shares={shares} />
      <div className="h-px w-full bg-neutral-200" />
      <FeeRow
        amount={networkFee}
        isError={isFeesError}
        label={t('hemi-earn.pool.form.network-fee')}
        token={nativeToken}
      />
      <FeeRow
        amount={ethereumGasFee}
        isError={isFeesError}
        label={t('hemi-earn.pool.form.ethereum-gas-fee')}
        token={nativeToken}
      />
      <FeeRow
        amount={totalFees}
        isError={isFeesError}
        label={t('common.total')}
        token={nativeToken}
      />
    </div>
  )
}
