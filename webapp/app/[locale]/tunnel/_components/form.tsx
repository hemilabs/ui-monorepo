import Big from 'big.js'
import { FormEvent, ReactNode } from 'react'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'

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
  formContent: ReactNode
  onSubmit: () => void
  reviewOperation: ReactNode
  submitButton: ReactNode
  transactionStatus: ReactNode
}

export const BridgeForm = ({
  formContent,
  onSubmit,
  reviewOperation,
  submitButton,
  transactionStatus,
}: Props) => (
  <>
    <Card>
      <form
        className="flex w-full flex-col gap-y-4 text-zinc-800"
        onSubmit={function (e: FormEvent) {
          e.preventDefault()
          onSubmit()
        }}
      >
        {formContent}
        {submitButton}
      </form>
    </Card>
    <div className="flex flex-col gap-y-4">
      <div className="shrink-1 order-2 md:order-1 md:w-full md:min-w-96">
        {reviewOperation}
      </div>
      <div className="order-1 flex flex-col gap-y-4 md:order-2">
        {transactionStatus}
      </div>
    </div>
  </>
)
