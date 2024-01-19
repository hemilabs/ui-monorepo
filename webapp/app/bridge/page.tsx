'use client'

import { Card } from 'app/components/design/card'
import { TokenSelector } from 'app/components/TokenSelector'
import { bvm, networks } from 'app/networks'
import Big from 'big.js'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import dynamic from 'next/dynamic'
import { FormEvent, useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { formatUnits } from 'viem'
import { useConfig, useSendTransaction, useWaitForTransaction } from 'wagmi'

import { useBridgeState } from './useBridgeState'
import { useDepositNativeToken } from './useBridgeToken'

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
    import('app/bridge/components/OperationButton').then(
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

type UseDeposit = {
  canDeposit: boolean
  fromInput: string
  fromToken: Token
  toToken: Token
}
const useDeposit = function ({
  canDeposit,
  fromInput,
  fromToken,
  toToken,
}: UseDeposit) {
  const depositingNative = isNativeToken(fromToken)

  const { depositNativeToken, depositNativeTokenTxHash } =
    useDepositNativeToken({
      amount: fromInput,
      enabled: depositingNative && canDeposit,
    })

  const { status } = useWaitForTransaction({
    hash: depositNativeTokenTxHash,
  })

  // we clone the "status" but we manually update it
  // so the error/success message can be displayed for a few extra seconds
  const [depositStatus, setDepositStatus] =
    useState<ReturnType<typeof useSendTransaction>['status']>('idle')

  const deposit = function (e: FormEvent) {
    e.preventDefault()
    if (depositingNative) {
      setDepositStatus('loading')
      depositNativeToken()
    }
    // TODO Enable deposit token
    // else {
    //   depositToken()
    // }
  }

  useEffect(
    function delayStatus() {
      if (status === 'success') {
        setDepositStatus('success')
      } else if (status === 'error') {
        setDepositStatus('error')
      }
    },
    [status, setDepositStatus],
  )

  useEffect(
    function clearTransactionStatusMessage() {
      if (['error', 'success'].includes(depositStatus)) {
        // clear success message in 5 secs for success, 10 secs for error
        const timeoutId = setTimeout(
          () => setDepositStatus('idle'),
          depositStatus === 'success' ? 5000 : 10000,
        )

        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [depositStatus, setDepositStatus],
  )

  const { refetchBalance: refetchFromToken } = useNativeTokenBalance(fromToken)
  const { refetchBalance: refetchToToken } = useNativeTokenBalance(toToken)

  useEffect(
    function refetchBalances() {
      if (['error', 'success'].includes(depositStatus)) {
        refetchFromToken()
        refetchToToken()
      }
    },
    [depositStatus, refetchFromToken, refetchToToken],
  )

  return {
    deposit,
    depositStatus,
    depositTxHash: depositNativeTokenTxHash,
  }
}

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

  const {
    balance: walletNativeTokenBalance,
    status: nativeTokenBalanceStatus,
  } = useNativeTokenBalance(fromToken, isNativeToken(fromToken))

  const { balance: walletTokenBalance, status: tokenBalanceStatus } =
    useTokenBalance(fromToken, !isNativeToken(fromToken))

  const isDepositOperation = toNetworkId === bvm.id

  const balancesLoaded =
    nativeTokenBalanceStatus === 'success' && tokenBalanceStatus === 'success'

  const canDeposit =
    isDepositOperation &&
    balancesLoaded &&
    Big(fromInput).gt(0) &&
    inputEnoughInBalance({
      fromInput,
      fromToken,
      walletNativeTokenBalance,
      walletTokenBalance,
    })

  const fromTokenBalanceInWallet = formatUnits(
    isNativeToken(fromToken) ? walletNativeTokenBalance : walletTokenBalance,
    fromToken.decimals,
  )

  const { deposit, depositTxHash, depositStatus } = useDeposit({
    canDeposit,
    fromInput,
    fromToken,
    toToken,
  })

  useEffect(
    function () {
      if (depositStatus === 'success') {
        updateFromInput('0')
      }
    },
    [depositStatus, updateFromInput],
  )

  const canSetMaxBalance =
    balancesLoaded &&
    depositStatus === 'idle' &&
    Big(fromTokenBalanceInWallet).gt(0)

  const setMaxBalance = () =>
    updateFromInput(Big(fromTokenBalanceInWallet).toFixed(2, Big.roundDown))

  const canToggle = depositStatus === 'idle'

  const fromChain = chains.find(c => c.id === fromNetworkId)
  const toChain = chains.find(c => c.id === toNetworkId)

  return (
    <div className="mx-auto flex h-screen w-full flex-col gap-y-4 px-4 md:h-full md:max-w-fit md:flex-row md:gap-x-4 md:pt-10">
      <Card>
        <form
          className="w-full text-zinc-800"
          onSubmit={isDepositOperation ? deposit : undefined}
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
                <button
                  className="cursor-pointer font-semibold text-slate-700"
                  disabled={!canSetMaxBalance}
                  onClick={setMaxBalance}
                  type="button"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>
          <div className="my-6 flex w-full">
            <button
              className={`mx-auto rounded-lg p-2 shadow-xl ${
                canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
              }`}
              disabled={!canToggle}
              onClick={toggle}
              type="button"
            >
              <svg
                fill="none"
                height="16"
                viewBox="0 0 22 16"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 8H1.20711C0.761654 8 0.538571 8.53857 0.853553 8.85355L3.64645 11.6464C3.84171 11.8417 4.15829 11.8417 4.35355 11.6464L7.14645 8.85355C7.46143 8.53857 7.23835 8 6.79289 8H5C5 4.69 7.69 2 11 2C11.8773 2 12.7169 2.18863 13.4663 2.53312C13.6675 2.62557 13.9073 2.59266 14.0638 2.43616L14.8193 1.68072C15.0455 1.45454 15.0041 1.07636 14.7216 0.926334C13.5783 0.3192 12.3008 -0.000361652 11 3.07144e-07C6.58 3.07144e-07 3 3.58 3 8ZM17 8C17 11.31 14.31 14 11 14C10.1471 14.0029 9.30537 13.8199 8.53281 13.4656C8.33221 13.3736 8.09316 13.4068 7.9371 13.5629L7.18072 14.3193C6.95454 14.5455 6.99594 14.9236 7.27843 15.0737C8.42167 15.6808 9.69924 16.0004 11 16C15.42 16 19 12.42 19 8H20.7929C21.2383 8 21.4614 7.46143 21.1464 7.14645L18.3536 4.35355C18.1583 4.15829 17.8417 4.15829 17.6464 4.35355L14.8536 7.14645C14.5386 7.46143 14.7617 8 15.2071 8H17Z"
                  fill="black"
                />
              </svg>
            </button>
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
          <OperationButton
            disabled={!canDeposit || depositStatus === 'loading'}
            // Eventually, withdraw needs to be added
            operation="deposit"
            operationStatus={depositStatus}
          />
        </form>
      </Card>
      <div className="flex flex-col gap-y-4">
        <div className="shrink-1 order-2 md:order-1 md:w-80">
          <ReviewDeposit
            deposit={fromInput}
            depositSymbol={fromToken.symbol}
            gas="TBD"
            gasSymbol={fromChain?.nativeCurrency.symbol}
            targetSymbol={toToken.symbol}
            total="TBD"
          />
        </div>
        {depositStatus !== 'idle' && (
          <div className="order-1 md:order-2">
            <TransactionStatus
              operation={`Bridging ${fromInput} ${fromToken.symbol} to ${toChain.name}`}
              status={depositStatus}
              txHash={depositTxHash}
            />
          </div>
        )}
      </div>
    </div>
  )
}
