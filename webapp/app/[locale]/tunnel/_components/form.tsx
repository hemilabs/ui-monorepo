import { TokenLogo } from 'app/components/tokenLogo'
import { TokenSelector } from 'app/components/tokenSelector'
import { hemi, networks, type RemoteChain } from 'app/networks'
import Big from 'big.js'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { FormEvent, ReactNode } from 'react'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { Card } from 'ui-common/components/card'
import { formatNumber, getFormattedValue } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import { type TunnelState, useTunnelState } from '../_hooks/useTunnelState'

import { ConnectWallet } from './connectWallet'
import { ToggleButton } from './ToggleButton'

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

const SetMaxBalance = dynamic(
  () =>
    import('app/[locale]/tunnel/_components/SetMaxBalance').then(
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

const ArrowsIcon = () => (
  <svg
    fill="none"
    height="26"
    viewBox="0 0 26 26"
    width="26"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      className="fill-orange-950"
      clipRule="evenodd"
      d="M17.3339 24.2817L23.1993 18.4162L17.3339 12.5508L15.8017 14.0829L19.0517 17.3329H3.25049V19.4995H19.0517L15.8017 22.7495L17.3339 24.2817ZM10.1992 11.9162L6.94921 8.66626H22.7505V6.49959H6.94921L10.1992 3.24959L8.66715 1.71753L2.80176 7.58292L8.66715 13.4484L10.1992 11.9162Z"
      fillRule="evenodd"
    />
  </svg>
)

type InputEnoughInBalance = Pick<
  TunnelState,
  'fromNetworkId' | 'fromToken' | 'fromInput'
> & {
  chainId?: number
  fromInput: string
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

type FormContentProps = {
  tunnelState: ReturnType<typeof useTunnelState>
  isRunningOperation: boolean
}

export const FormContent = function ({
  tunnelState,
  isRunningOperation,
}: FormContentProps) {
  const {
    fromNetworkId,
    fromInput,
    fromToken,
    updateFromNetwork,
    updateFromInput,
    updateFromToken,
    toNetworkId,
    updateToNetwork,
    toggleInput,
    toToken,
  } = tunnelState

  const t = useTranslations('tunnel-page')

  return (
    <>
      <div className="flex items-center gap-x-2">
        <ArrowsIcon />
        <h3 className="text-xl font-medium capitalize text-black">
          {t('title')}
        </h3>
      </div>
      <h4 className="text-sm font-normal text-slate-500">{t('subtitle')}</h4>
      <div className="flex w-full items-center justify-between text-sm">
        <span>{t('form.from-network')}</span>
        <NetworkSelector
          disabled={isRunningOperation}
          networkId={fromNetworkId}
          networks={networks.filter(chain => chain.id !== toNetworkId)}
          onSelectNetwork={updateFromNetwork}
          readonly={fromNetworkId === hemi.id}
        />
      </div>
      <div className="flex flex-col justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
        <div className="flex flex-row">
          <div className="flex basis-1/3 flex-col gap-y-2">
            <span className="text-xs font-normal">{t('form.you-send')}</span>
            <div className="flex max-w-7 sm:max-w-none">
              <input
                className="ml-1 max-w-28 bg-transparent text-base font-medium text-neutral-400"
                disabled={isRunningOperation}
                onChange={e => updateFromInput(e.target.value)}
                type="text"
                value={fromInput}
              />
            </div>
          </div>
          <div className="flex basis-2/3 flex-col justify-between gap-y-3">
            <TokenSelector
              disabled={isRunningOperation}
              onSelectToken={updateFromToken}
              selectedToken={fromToken}
              tokens={tokenList.tokens.filter(
                token => token.chainId === fromNetworkId,
              )}
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-2 text-xs font-normal sm:text-sm">
          {t('form.balance')}: <Balance token={fromToken} />
          <SetMaxBalance
            fromToken={fromToken}
            isRunningOperation={isRunningOperation}
            onSetMaxBalance={maxBalance =>
              updateFromInput(formatNumber(maxBalance, 2))
            }
          />
        </div>
      </div>
      <div className="mx-auto flex h-10">
        <ToggleButton disabled={isRunningOperation} toggle={toggleInput} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>{t('form.to-network')}</span>
        <NetworkSelector
          disabled={isRunningOperation}
          networkId={toNetworkId}
          networks={networks.filter(chain => chain.id !== fromNetworkId)}
          onSelectNetwork={updateToNetwork}
          readonly={toNetworkId === hemi.id}
        />
      </div>
      <div className="flex flex-col justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
        <div className="flex flex-row">
          <div className="flex basis-1/3 flex-col gap-y-2">
            <span className="text-xs font-normal">{t('form.you-receive')}</span>
            <div className="flex items-center gap-x-2">
              <span className="text-base font-medium text-neutral-400">
                {/* Bridging goes 1:1, so output equals input */}
                <span className="ml-1">{fromInput}</span>
              </span>
            </div>
          </div>
          <div className="flex basis-2/3 justify-end gap-y-3">
            <div className="flex items-center justify-end gap-x-2 text-xs">
              <TokenLogo token={toToken} />
              <span className="text-sm font-medium text-slate-700">
                {toToken.symbol}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-x-2 text-sm font-normal">
          {t('form.balance')}: <Balance token={toToken} />
        </div>
      </div>
    </>
  )
}

type TunnelFormProps = {
  bottomSection?: ReactNode
  expectedChainId: RemoteChain['id']
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
  bottomSection,
  expectedChainId,
  formContent,
  gas,
  onSubmit,
  operationSymbol,
  showReview,
  submitButton,
  total,
  transactionsList = [],
}: TunnelFormProps) {
  const { isConnected } = useAccount()
  const t = useTranslations()
  const { operation } = useTunnelOperation()

  return (
    <div className="grid grid-cols-1 gap-y-4 pt-2 xl:grid-cols-[1fr_400px_1fr] xl:gap-x-4">
      <div className="mx-auto flex w-full flex-col gap-y-2 md:w-96 xl:col-start-2">
        {['deposit', 'withdraw'].includes(operation) && (
          <SwitchToNetwork selectedNetworkId={expectedChainId} />
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
        {bottomSection}
      </div>
      {transactionsList.length > 0 && (
        <div className="mx-auto flex w-full flex-col gap-y-4 md:max-w-96 xl:mx-0 xl:max-w-72">
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
