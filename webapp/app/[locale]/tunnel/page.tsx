'use client'

import { TokenLogo } from 'app/components/tokenLogo'
import { TokenSelector } from 'app/components/TokenSelector'
import { hemi, networks } from 'app/networks'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { formatNumber } from 'utils/format'

import { Claim } from './_components/claim'
import { Deposit } from './_components/deposit'
import { Prove } from './_components/prove'
import { ToggleButton } from './_components/ToggleButton'
import { Withdraw } from './_components/withdraw'
import { useBridgeState } from './_hooks/useBridgeState'

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
type Props = {
  bridgeState: ReturnType<typeof useBridgeState>
  isRunningOperation: boolean
}

const FormContent = function ({ bridgeState, isRunningOperation }: Props) {
  const {
    fromNetworkId,
    fromInput,
    fromToken,
    operation,
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
      {['deposit', 'withdraw'].includes(operation) && (
        <SwitchToNetwork selectedNetwork={fromNetworkId} />
      )}
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
        <div className="flex basis-2/3 flex-col justify-between">
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
            <span className="text-base font-medium text-neutral-400">
              {/* Bridging goes 1:1, so output equals input */}
              <span className="ml-1">{fromInput}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="flex items-center justify-end gap-x-2 text-xs">
            <TokenLogo token={toToken} />
            <span className="text-sm font-medium text-slate-700">
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

const OperationsComponent = {
  claim: Claim,
  deposit: Deposit,
  prove: Prove,
  withdraw: Withdraw,
}

export default function Bridge() {
  const bridgeState = useBridgeState()

  const OperationComponent = OperationsComponent[bridgeState.operation]

  return (
    <div className="h-fit-rest-screen mx-auto flex w-full flex-col gap-y-4 px-4 md:max-w-fit md:flex-row md:gap-x-4 md:pt-10">
      <OperationComponent
        renderForm={isRunningOperation => (
          <FormContent
            bridgeState={bridgeState}
            isRunningOperation={isRunningOperation}
          />
        )}
        // @ts-expect-error This works, but TS does not pick it up correctly.
        state={bridgeState}
      />
    </div>
  )
}
