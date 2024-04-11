import Big from 'big.js'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'

const TransactionStatus = dynamic(
  () =>
    import('components/transactionStatus').then(mod => mod.TransactionStatus),
  {
    ssr: false,
  },
)

type InputEnoughInBalance = {
  chainId?: number
  fromInput: string
  fromNetworkId: number
  fromToken: Token
  walletNativeTokenBalance: bigint
  walletTokenBalance: bigint
}
const inputEnoughInBalance = ({
  fromInput,
  fromToken,
  walletNativeTokenBalance,
  walletTokenBalance,
}: Omit<InputEnoughInBalance, 'fromNetworkId'>) =>
  (isNativeToken(fromToken) &&
    Big(fromInput).lt(
      formatUnits(walletNativeTokenBalance, fromToken.decimals),
    )) ||
  (!isNativeToken(fromToken) &&
    Big(fromInput).lt(formatUnits(walletTokenBalance, fromToken.decimals)))

export const canSubmit = ({
  chainId,
  fromInput,
  fromNetworkId,
  fromToken,
  walletNativeTokenBalance,
  walletTokenBalance,
}: InputEnoughInBalance) =>
  Big(fromInput).gt(0) &&
  chainId === fromNetworkId &&
  inputEnoughInBalance({
    fromInput,
    fromToken,
    walletNativeTokenBalance,
    walletTokenBalance,
  })

type GetTotal = {
  fees?: bigint
  fromInput: string
  fromToken: Token
}
export const getTotal = ({
  fees = BigInt(0),
  fromInput,
  fromToken,
}: GetTotal) =>
  formatUnits(
    BigInt(
      Big(parseUnits(fromInput, fromToken.decimals).toString())
        .plus(fees.toString())
        .toFixed(),
    ),
    fromToken.decimals,
  )

export const getFormattedValue = (value: string) =>
  Big(value.replace(/,/g, '')).lt('0.001') ? '< 0.001' : formatNumber(value, 3)

type Props = {
  formContent: ReactNode
  gas: {
    amount: string
    label: string
    symbol: string
  }
  onSubmit: () => void
  operationSymbol: string
  showReview: boolean
  submitButton: ReactNode
  total: string
  transactionsList: {
    id: string
    status: React.ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
}

export const TunnelForm = function ({
  formContent,
  gas,
  onSubmit,
  operationSymbol,
  showReview,
  submitButton,
  total,
  transactionsList,
}: Props) {
  const t = useTranslations('common')
  return (
    <>
      <Card radius="large">
        <form
          className="flex w-full flex-col gap-y-4 text-zinc-800 lg:min-w-[400px]"
          onSubmit={function (e: FormEvent) {
            e.preventDefault()
            onSubmit()
          }}
        >
          {formContent}
          {submitButton}
          {showReview && (
            <div className="mt-2 flex flex-col gap-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">{gas.label}</span>
                <span>{`${getFormattedValue(gas.amount)} ${gas.symbol}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">{t('total')}</span>
                <span>{`${getFormattedValue(total)} ${operationSymbol}`}</span>
              </div>
            </div>
          )}
        </form>
      </Card>
      <div className="flex flex-col gap-y-4">
        {transactionsList.map(transaction => (
          <TransactionStatus
            key={transaction.id}
            status={transaction.status}
            text={transaction.text}
            txHash={transaction.txHash}
          />
        ))}
      </div>
    </>
  )
}
