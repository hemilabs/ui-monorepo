'use client'

import { Card } from 'app/components/design/card'
import { TokenSelector } from 'app/components/TokenSelector'
import { bvm, networks } from 'app/networks'
import Big from 'big.js'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'
import { useConfig } from 'wagmi'

import { useBridgeState } from './useBridgeState'
import { useDeposit } from './useDeposit'
import { useWithdraw } from './useWithdraw'

// const AddNetworkToWallet = dynamic(
//   () =>
//     import('components/addNetworkToWallet').then(mod => mod.AddNetworkToWallet),
//   { loading: () => null, ssr: false },
// )

const Balance = dynamic(
  () => import('components/balance').then(mod => mod.Balance),
  {
    loading: () => (
      <Skeleton className="h-full" containerClassName="basis-1/3" />
    ),
    ssr: false,
  },
)

const NetworkSelector = dynamic(
  () =>
    import('app/components/networkSelector').then(mod => mod.NetworkSelector),
  {
    loading: () => (
      <Skeleton className="h-10 py-2" containerClassName="basis-1/4" />
    ),
    ssr: false,
  },
)

const OperationButton = dynamic(
  () =>
    import('app/bridge/_components/OperationButton').then(
      mod => mod.OperationButton,
    ),
  {
    loading: () => <Skeleton className="h-14" />,
    ssr: false,
  },
)

const ReviewDeposit = dynamic(
  () => import('components/reviewBox').then(mod => mod.ReviewDeposit),
  {
    loading: () => <Skeleton className="h-48 w-full md:w-80" />,
    ssr: false,
  },
)

const ReviewWithdraw = dynamic(
  () => import('components/reviewBox').then(mod => mod.ReviewWithdraw),
  {
    loading: () => <Skeleton className="h-48 w-full md:w-80" />,
    ssr: false,
  },
)

const SetMaxBalance = dynamic(
  () =>
    import('app/bridge/_components/SetMaxBalance').then(
      mod => mod.SetMaxBalance,
    ),
  {
    loading: () => <Skeleton className="h-5 w-8" />,
    ssr: false,
  },
)

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

const ToggleButton = dynamic(
  () =>
    import('app/bridge/_components/ToggleButton').then(mod => mod.ToggleButton),
  {
    loading: () => (
      <Skeleton
        className="mx-auto h-7 w-8 rounded-lg"
        containerClassName="mx-auto"
      />
    ),
    ssr: false,
  },
)

type InputEnoughInBalance = {
  fromInput: string
  fromToken: Token
  walletNativeTokenBalance: bigint
  walletTokenBalance: bigint
}
const inputEnoughInBalance = ({
  fromInput,
  fromToken,
  walletNativeTokenBalance,
  walletTokenBalance,
}: InputEnoughInBalance) =>
  (isNativeToken(fromToken) &&
    Big(fromInput).lt(
      formatUnits(walletNativeTokenBalance, fromToken.decimals),
    )) ||
  (!isNativeToken(fromToken) &&
    Big(fromInput).lt(formatUnits(walletTokenBalance, fromToken.decimals)))

type GetTotalFees = {
  fees: bigint
  fromInput: string
  fromToken: Token
}
const getTotalFees = ({ fees, fromInput, fromToken }: GetTotalFees) =>
  formatUnits(
    BigInt(
      Big(parseUnits(fromInput, fromToken.decimals).toString())
        .plus(fees.toString())
        .toFixed(),
    ),
    fromToken.decimals,
  )

export default function Bridge() {
  const { chains = [] } = useConfig()

  const {
    fromNetworkId,
    fromInput,
    fromToken,
    updateFromNetwork,
    updateFromInput,
    updateFromToken,
    toNetworkId,
    updateToNetwork,
    toggle,
    toToken,
  } = useBridgeState()

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken,
    isNativeToken(fromToken),
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !isNativeToken(fromToken),
  )

  const isDepositOperation = toNetworkId === bvm.id
  const isWithdrawOperation = !isDepositOperation

  const canDeposit =
    Big(fromInput).gt(0) &&
    inputEnoughInBalance({
      fromInput,
      fromToken,
      walletNativeTokenBalance,
      walletTokenBalance,
    })

  const onSuccessOperation = () => updateFromInput('0')

  const { deposit, depositFees, depositStatus, depositTxHash } = useDeposit({
    canDeposit,
    fromInput,
    fromToken,
    onSuccess: onSuccessOperation,
    toToken,
  })

  const canWithdraw =
    Big(fromInput).gt(0) &&
    inputEnoughInBalance({
      fromInput,
      fromToken,
      walletNativeTokenBalance,
      walletTokenBalance,
    })

  const { withdraw, withdrawFees, withdrawStatus, withdrawTxHash } =
    useWithdraw({
      canWithdraw,
      fromInput,
      fromToken,
      onSuccess: onSuccessOperation,
      toToken,
    })

  const isRunningOperation = !(
    depositStatus === 'idle' && withdrawStatus === 'idle'
  )

  const fromChain = chains.find(c => c.id === fromNetworkId)
  const toChain = chains.find(c => c.id === toNetworkId)

  const totalDeposit = getTotalFees({
    fees: depositFees,
    fromInput,
    fromToken,
  })

  const totalWithdraw = getTotalFees({
    fees: withdrawFees,
    fromInput,
    fromToken,
  })

  const operationButtonProps = isDepositOperation
    ? {
        disabled: !canDeposit || depositStatus === 'loading',
        operation: 'deposit',
        operationStatus: depositStatus,
      }
    : {
        disabled: !canWithdraw || withdrawStatus === 'loading',
        operation: 'withdraw',
        operationStatus: withdrawStatus,
      }

  return (
    <div className="mx-auto flex h-screen w-full flex-col gap-y-4 px-4 md:h-full md:max-w-fit md:flex-row md:gap-x-4 md:pt-10">
      <Card>
        <form
          className="w-full text-zinc-800"
          onSubmit={isDepositOperation ? deposit : withdraw}
        >
          <h3 className="text-xl font-medium text-black">Bridge</h3>
          <div className="my-2">
            <SwitchToNetwork selectedNetwork={fromNetworkId} />
          </div>
          <div className="my-2 flex w-full items-center justify-between text-sm">
            <span>From Network</span>
            <NetworkSelector
              networkId={fromNetworkId}
              networks={networks.filter(chain => chain.id !== toNetworkId)}
              onSelectNetwork={updateFromNetwork}
              readonly={fromNetworkId === bvm.id}
            />
          </div>
          <div className="flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400 ">
            <div className="flex basis-1/2 flex-col gap-y-2">
              <span className="text-xs font-normal">You send</span>
              <div className="flex items-center gap-x-2">
                <button
                  className="cursor-pointer rounded-md bg-gray-200 p-[6px]"
                  type="button"
                >
                  <svg
                    fill="none"
                    height="12"
                    viewBox="0 0 13 12"
                    width="13"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.60251 3.86954L3.69236 3.868V6.85181C3.69236 7.20464 3.98588 7.49067 4.34796 7.49067C4.71004 7.49067 5.00356 7.20464 5.00356 6.85181V3.86615L6.09341 3.86461C6.45704 3.8641 6.55205 3.65511 6.30406 3.39622L4.6099 1.62755C4.44458 1.45496 4.17654 1.45975 4.02038 1.62839L2.38366 3.3958C2.1409 3.65796 2.2376 3.87006 2.60251 3.86954Z"
                      fill="#17171A"
                    />
                    <path
                      d="M7.41024 8.13046L8.50009 8.132V5.14819C8.50009 4.79536 8.79361 4.50933 9.15569 4.50933C9.51777 4.50933 9.81129 4.79536 9.81129 5.14819V8.13385L10.9011 8.13539C11.2648 8.1359 11.3598 8.34489 11.1118 8.60378L9.41763 10.3724C9.25231 10.545 8.98427 10.5402 8.82811 10.3716L7.19139 8.6042C6.94863 8.34204 7.04533 8.12994 7.41024 8.13046Z"
                      fill="#17171A"
                    />
                  </svg>
                </button>
                <div className="flex max-w-7 sm:max-w-none">
                  $
                  <input
                    className="ml-1 max-w-28 bg-transparent text-base font-medium text-neutral-400"
                    onChange={e => updateFromInput(e.target.value)}
                    type="text"
                    value={fromInput}
                  />
                </div>
              </div>
            </div>
            <div className="flex basis-1/2 flex-col justify-between">
              <TokenSelector
                onSelectToken={updateFromToken}
                selectedToken={fromToken}
                tokens={tokenList.tokens.filter(
                  t => t.chainId === fromNetworkId,
                )}
              />
              <div className="flex items-center justify-end gap-x-2 text-xs font-normal sm:text-sm">
                Balance: <Balance token={fromToken} />
                <SetMaxBalance
                  fromToken={fromToken}
                  isRunningOperation={isRunningOperation}
                  onSetMaxBalance={maxBalance =>
                    updateFromInput(formatNumber(maxBalance, 2))
                  }
                />
              </div>
            </div>
          </div>
          <div className="my-6 flex w-full">
            <ToggleButton disabled={isRunningOperation} toggle={toggle} />
          </div>
          <div className="my-2 flex items-center justify-between text-sm">
            <span>To Network</span>
            <NetworkSelector
              networkId={toNetworkId}
              networks={networks.filter(chain => chain.id !== fromNetworkId)}
              onSelectNetwork={updateToNetwork}
              readonly={toNetworkId === bvm.id}
            />
          </div>
          <div className="mb-6 flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
            <div className="flex flex-col gap-y-2">
              <span className="text-xs font-normal">You receive</span>
              <div className="flex items-center gap-x-2">
                <button
                  className="cursor-pointer rounded-md bg-gray-200 p-[6px]"
                  type="button"
                >
                  <svg
                    fill="none"
                    height="12"
                    viewBox="0 0 13 12"
                    width="13"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.60251 3.86954L3.69236 3.868V6.85181C3.69236 7.20464 3.98588 7.49067 4.34796 7.49067C4.71004 7.49067 5.00356 7.20464 5.00356 6.85181V3.86615L6.09341 3.86461C6.45704 3.8641 6.55205 3.65511 6.30406 3.39622L4.6099 1.62755C4.44458 1.45496 4.17654 1.45975 4.02038 1.62839L2.38366 3.3958C2.1409 3.65796 2.2376 3.87006 2.60251 3.86954Z"
                      fill="#17171A"
                    />
                    <path
                      d="M7.41024 8.13046L8.50009 8.132V5.14819C8.50009 4.79536 8.79361 4.50933 9.15569 4.50933C9.51777 4.50933 9.81129 4.79536 9.81129 5.14819V8.13385L10.9011 8.13539C11.2648 8.1359 11.3598 8.34489 11.1118 8.60378L9.41763 10.3724C9.25231 10.545 8.98427 10.5402 8.82811 10.3716L7.19139 8.6042C6.94863 8.34204 7.04533 8.12994 7.41024 8.13046Z"
                      fill="#17171A"
                    />
                  </svg>
                </button>
                <span className="text-base font-medium text-neutral-400">
                  <span>$</span>
                  {/* Bridging goes 1:1, so output equals input */}
                  <span className="ml-1 ">{fromInput}</span>
                </span>
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="flex items-center justify-end gap-x-2 text-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`${toToken.symbol} Logo`}
                  height={24}
                  src={toToken.logoURI}
                  width={24}
                />
                <span className="text-sm font-medium uppercase text-slate-700">
                  {toToken.symbol}
                </span>
              </div>
              <div className="flex items-center justify-end gap-x-2 text-sm font-normal">
                Balance: <Balance token={toToken} />
              </div>
            </div>
          </div>
          {/* @ts-expect-error operation prop is typed as string, but it actually is 'deposit' | 'withdraw' */}
          <OperationButton {...operationButtonProps} />
        </form>
      </Card>
      <div className="flex flex-col gap-y-4">
        <div className="shrink-1 order-2 md:order-1 md:w-full md:min-w-80">
          {isDepositOperation && (
            <ReviewDeposit
              canDeposit={canDeposit}
              deposit={formatNumber(fromInput, 3)}
              depositSymbol={fromToken.symbol}
              gas={formatNumber(
                formatUnits(depositFees, fromChain?.nativeCurrency.decimals),
                3,
              )}
              gasSymbol={fromChain?.nativeCurrency.symbol}
              total={formatNumber(totalDeposit, 3)}
            />
          )}
          {isWithdrawOperation && (
            <ReviewWithdraw
              canWithdraw={canWithdraw}
              gas={formatNumber(
                formatUnits(withdrawFees, fromChain?.nativeCurrency.decimals),
                3,
              )}
              gasSymbol={fromChain?.nativeCurrency.symbol}
              total={formatNumber(totalWithdraw, 3)}
              withdraw={formatNumber(fromInput, 3)}
              withdrawSymbol={fromToken.symbol}
            />
          )}
        </div>
        <div className="order-1 md:order-2">
          {depositStatus !== 'idle' && (
            <TransactionStatus
              operation={`Bridging ${fromInput} ${fromToken.symbol} to ${toChain.name}`}
              status={depositStatus}
              txHash={depositTxHash}
            />
          )}
          {withdrawStatus !== 'idle' && (
            <TransactionStatus
              operation={`Withdrawing ${fromInput} ${toToken.symbol} from ${fromChain.name}`}
              status={withdrawStatus}
              txHash={withdrawTxHash}
            />
          )}
        </div>
      </div>
    </div>
  )
}
