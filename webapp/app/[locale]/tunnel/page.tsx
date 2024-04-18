'use client'

import { MessageStatus } from '@eth-optimism/sdk'
import { TokenLogo } from 'app/components/tokenLogo'
import { TokenSelector } from 'app/components/TokenSelector'
import { bridgeableNetworks, hemi, networks } from 'app/networks'
import { useAnyChainGetTransactionMessageStatus } from 'hooks/useL2Bridge'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { tokenList } from 'tokenList'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { formatNumber } from 'utils/format'

import { Claim } from './_components/claim'
import { Deposit } from './_components/deposit'
import { Prove } from './_components/prove'
import { ToggleButton } from './_components/ToggleButton'
import { Withdraw } from './_components/withdraw'
import { useTunnelOperation, useTunnelState } from './_hooks/useTunnelState'

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
  tunnelState: ReturnType<typeof useTunnelState>
  isRunningOperation: boolean
}

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

const FormContent = function ({ tunnelState, isRunningOperation }: Props) {
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
  const { operation } = useTunnelOperation()

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
        <div className="flex basis-2/3 flex-col justify-between gap-y-3">
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
      <div className="mx-auto flex h-10">
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
        <div className="flex flex-col justify-between gap-y-3">
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

const OperationByMessageStatus = {
  [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: 'prove',
  [MessageStatus.READY_TO_PROVE]: 'prove',
  [MessageStatus.IN_CHALLENGE_PERIOD]: 'claim',
  [MessageStatus.READY_FOR_RELAY]: 'claim',
  [MessageStatus.RELAYED]: 'claim',
}

export default function Tunnel() {
  const tunnelState = useTunnelState()
  const { operation, txHash } = useTunnelOperation()
  const { setQueryParams } = useQueryParams()

  const { messageStatus } = useAnyChainGetTransactionMessageStatus({
    l1ChainId: bridgeableNetworks[0].id,
    transactionHash: txHash,
  })

  useEffect(
    function updateWithdrawOperationComponentPerMessageStatus() {
      if (!operation || operation === 'deposit' || !messageStatus) {
        return
      }
      const newOperation = OperationByMessageStatus[messageStatus]
      if (operation !== newOperation) {
        setQueryParams({ operation: newOperation })
      }
    },
    [messageStatus, operation, setQueryParams],
  )

  const stateLoaded = !txHash || messageStatus !== undefined
  const OperationComponent = stateLoaded ? OperationsComponent[operation] : null

  return (
    <div className="h-fit-rest-screen">
      {stateLoaded && (
        <OperationComponent
          renderForm={isRunningOperation => (
            <FormContent
              isRunningOperation={isRunningOperation}
              tunnelState={tunnelState}
            />
          )}
          state={tunnelState}
        />
      )}
      {/* Add better loading indicator https://github.com/BVM-priv/ui-monorepo/issues/157 */}
      {!stateLoaded && <span>...</span>}
    </div>
  )
}
