'use client'

import { TokenLogo } from 'app/components/tokenLogo'
import { TokenSelector } from 'app/components/TokenSelector'
import { hemi, networks } from 'app/networks'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { formatNumber } from 'utils/format'

import { Deposit } from './_components/deposit'
import { Withdraw } from './_components/withdraw'
import { useBridgeState } from './useBridgeState'

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
    import('app/[locale]/bridge/_components/SetMaxBalance').then(
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

const ToggleButton = dynamic(
  () =>
    import('app/[locale]/bridge/_components/ToggleButton').then(
      mod => mod.ToggleButton,
    ),
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

type Props = {
  bridgeState: ReturnType<typeof useBridgeState>
  isRunningOperation: boolean
}

const FormContent = function ({ bridgeState, isRunningOperation }: Props) {
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
  } = bridgeState

  const t = useTranslations('bridge-page')

  return (
    <>
      <h3 className="text-xl font-medium capitalize text-black">
        {t('title')}
      </h3>
      <SwitchToNetwork selectedNetwork={fromNetworkId} />
      <div className="flex w-full items-center justify-between text-sm">
        <span>{t('form.from-network')}</span>
        <NetworkSelector
          networkId={fromNetworkId}
          networks={networks.filter(chain => chain.id !== toNetworkId)}
          onSelectNetwork={updateFromNetwork}
          readonly={fromNetworkId === hemi.id}
        />
      </div>
      <div className="flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
        <div className="flex basis-1/2 flex-col gap-y-2">
          <span className="text-xs font-normal">{t('form.you-send')}</span>
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
                disabled={isRunningOperation}
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
              token => token.chainId === fromNetworkId,
            )}
          />
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
      </div>
      <div className="my-2 flex w-full">
        <ToggleButton disabled={isRunningOperation} toggle={toggleInput} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span>{t('form.to-network')}</span>
        <NetworkSelector
          networkId={toNetworkId}
          networks={networks.filter(chain => chain.id !== fromNetworkId)}
          onSelectNetwork={updateToNetwork}
          readonly={toNetworkId === hemi.id}
        />
      </div>
      <div className="flex justify-between rounded-xl bg-zinc-50 p-4 text-zinc-400">
        <div className="flex flex-col gap-y-2">
          <span className="text-xs font-normal">{t('form.you-receive')}</span>
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
              <span className="ml-1">{fromInput}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-center justify-end gap-x-2 text-xs">
            <TokenLogo token={toToken} />
            <span className="text-sm font-medium uppercase text-slate-700">
              {toToken.symbol}
            </span>
          </div>
          <div className="flex items-center justify-end gap-x-2 text-sm font-normal">
            {t('form.balance')}: <Balance token={toToken} />
          </div>
        </div>
      </div>
    </>
  )
}

export default function Bridge() {
  const bridgeState = useBridgeState()

  const isDepositOperation = bridgeState.toNetworkId === hemi.id

  const OperationComponent = isDepositOperation ? Deposit : Withdraw

  return (
    <div className="mx-auto flex h-full w-full flex-col gap-y-4 px-4 md:max-w-fit md:flex-row md:gap-x-4 md:pt-10">
      <OperationComponent
        renderForm={isRunningOperation => (
          <FormContent
            bridgeState={bridgeState}
            isRunningOperation={isRunningOperation}
          />
        )}
        state={bridgeState}
      />
    </div>
  )
}
