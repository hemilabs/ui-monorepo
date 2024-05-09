import Big from 'big.js'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'
import { getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { Chain, formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from '../_hooks/useTunnelState'

import { ConnectWallet } from './connectWallet'

const SwitchToNetwork = dynamic(
  () => import('components/switchToNetwork').then(mod => mod.SwitchToNetwork),
  {
    ssr: false,
  },
)

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

type Props = {
  expectedChainId: Chain['id']
  formContent: ReactNode
  gas: {
    amount: string
    label: string
    symbol: string
  }
  onSubmit: () => void
  operationSymbol: string
  showReview: boolean
  submitButton?: ReactNode
  total: string
  transactionsList?: {
    id: string
    status: React.ComponentProps<typeof TransactionStatus>['status']
    text: string
    txHash: string
  }[]
}

export const TunnelForm = function ({
  expectedChainId,
  formContent,
  gas,
  onSubmit,
  operationSymbol,
  showReview,
  submitButton,
  total,
  transactionsList = [],
}: Props) {
  const { isConnected } = useAccount()
  const t = useTranslations()
  const { operation } = useTunnelOperation()

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-y-4 pt-2 lg:grid lg:grid-cols-[1fr_1fr_400px_1fr_1fr] lg:items-start lg:gap-x-4">
      {/* empty column for grid flow in large screens, do not remove */}
      <div className="hidden lg:col-span-2 lg:block" />
      <div className="mx-auto flex w-full flex-col gap-y-2 md:w-96">
        {['deposit', 'withdraw'].includes(operation) && (
          <SwitchToNetwork selectedNetwork={expectedChainId} />
        )}
        <Card borderColor="gray" padding="large" radius="large">
          <form
            className="flex flex-col gap-y-3 text-zinc-800"
            onSubmit={function (e: FormEvent) {
              e.preventDefault()
              onSubmit()
            }}
          >
            {formContent}
            {isConnected ? submitButton : <ConnectWallet />}
            {showReview && (
              <div className="mt-2 flex flex-col gap-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{gas.label}</span>
                  <span>{`${getFormattedValue(gas.amount)} ${
                    gas.symbol
                  }`}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">{t('common.total')}</span>
                  <span>{`${getFormattedValue(
                    total,
                  )} ${operationSymbol}`}</span>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
      {transactionsList.length > 0 && (
        <div className="flex w-full flex-col gap-y-4 md:max-w-96">
          {transactionsList.map(transaction => (
            <TransactionStatus
              key={transaction.id}
              status={transaction.status}
              text={transaction.text}
              txHash={transaction.txHash}
            />
          ))}
        </div>
      )}
    </div>
  )
}
