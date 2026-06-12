import { DisplayAmount } from 'components/displayAmount'
import { TokenLogo } from 'components/tokenLogo'
import { useHemi } from 'hooks/useHemi'
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

export type TopRowProps = {
  amount: bigint | undefined
  label: string
  token: EvmToken
}

const TopRow = function ({ amount, label, token }: TopRowProps) {
  if (amount !== undefined) {
    return (
      <Row label={label}>
        <div className="flex items-center gap-x-1 text-neutral-950">
          <DisplayAmount
            amount={formatUnits(amount, token.decimals)}
            showTokenLogo={false}
            token={token}
          />
          <div className="shadow-bs rounded-full">
            <TokenLogo size="small" token={token} />
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
  bridgingFee: bigint
  hemiGasFee: bigint
  isFeesError: boolean
  nativeToken: EvmToken
  topRow: TopRowProps
  totalFees: bigint
}

export const OperationSummary = function ({
  bridgingFee,
  hemiGasFee,
  isFeesError,
  nativeToken,
  topRow,
  totalFees,
}: Props) {
  const t = useTranslations()
  const hemi = useHemi()
  return (
    <div className="flex flex-col gap-y-2.5">
      <TopRow {...topRow} />
      <div className="h-px w-full bg-neutral-200" />
      <FeeRow
        amount={hemiGasFee}
        isError={isFeesError}
        label={t('common.network-gas-fee', { network: hemi.name })}
        token={nativeToken}
      />
      <FeeRow
        amount={bridgingFee}
        isError={isFeesError}
        label={t('hemi-earn.pool.form.bridging-fees')}
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
