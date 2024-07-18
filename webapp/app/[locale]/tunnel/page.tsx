'use client'

import { MessageStatus } from '@eth-optimism/sdk'
import { BtcDepositStatus } from 'app/context/tunnelHistoryContext/types'
import { featureFlags } from 'app/featureFlags'
import { isBtcTxHash } from 'btc-wallet/utils/hash'
import { ConnectWallet } from 'components/connectWallet'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { Suspense, useEffect } from 'react'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { isHash } from 'viem'
import { useAccount } from 'wagmi'

import { Claim } from './_components/claim'
import { Deposit } from './_components/deposit'
import { Prove } from './_components/prove'
import { View } from './_components/view'
import { Withdraw } from './_components/withdraw'
import { useTunnelOperation } from './_hooks/useTunnelOperation'
import { useTunnelState } from './_hooks/useTunnelState'

const OperationsComponent = {
  claim: Claim,
  deposit: Deposit,
  prove: Prove,
  view: View,
  withdraw: Withdraw,
}

const BtcOperationByStatus = {
  [BtcDepositStatus.TX_PENDING]: 'deposit',
  [BtcDepositStatus.TX_CONFIRMED]: 'deposit',
  [BtcDepositStatus.BTC_READY_CLAIM]: 'claim',
  [BtcDepositStatus.BTC_DEPOSITED]: 'view',
} as const

const EvmOperationByMessageStatus = {
  [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: 'prove',
  [MessageStatus.READY_TO_PROVE]: 'prove',
  [MessageStatus.IN_CHALLENGE_PERIOD]: 'claim',
  [MessageStatus.READY_FOR_RELAY]: 'claim',
  [MessageStatus.RELAYED]: 'view',
} as const

const updateOperationQueryParameter = function <
  T extends BtcDepositStatus | MessageStatus,
>({
  operation,
  operationByStatus,
  operationToIgnore,
  setQueryParams,
  status,
}: {
  operation: string
  operationByStatus: Record<T, string>
  operationToIgnore: string
  setQueryParams: ReturnType<typeof useQueryParams>['setQueryParams']
  status: T | undefined
}) {
  if (operation === operationToIgnore || status === undefined) {
    return
  }
  const newOperation = operationByStatus[status]
  if (operation !== newOperation) {
    // auto correct the operation
    setQueryParams({ operation: newOperation })
  }
}

const Operation = function ({
  state,
  stateLoaded,
}: {
  state: ReturnType<typeof useTunnelState>
  stateLoaded: boolean
}) {
  const { status } = useAccount()
  const t = useTranslations()
  const { operation, txHash } = useTunnelOperation()

  const OperationComponent = stateLoaded ? OperationsComponent[operation] : null

  const connectedToUnsupportedChain = useConnectedToUnsupportedEvmChain()

  return (
    <>
      {stateLoaded && OperationComponent && (
        <OperationComponent state={state} />
      )}
      {txHash && connectedToUnsupportedChain && (
        <ConnectWallet
          heading={t('common.connect-your-wallet')}
          subheading={t('tunnel-page.connect-wallet-to-review')}
        />
      )}
      {txHash && status === 'disconnected' && (
        <ConnectWallet
          heading={t('common.connect-your-wallet')}
          subheading={t('tunnel-page.connect-wallet-to-review')}
        />
      )}
      {/* Add better loading indicator https://github.com/BVM-priv/ui-monorepo/issues/157 */}
      {!stateLoaded && <span>...</span>}
    </>
  )
}

const Tunnel = function () {
  const deposits = useBtcDeposits()
  const { setQueryParams } = useQueryParams()
  const { withdrawals } = useTunnelHistory()
  const { operation, txHash } = useTunnelOperation()
  const tunnelState = useTunnelState()

  const isEvmTx = isHash(txHash)
  const isBtcTx = featureFlags.btcTunnelEnabled && isBtcTxHash(txHash)

  const depositBtcStatus = isBtcTx
    ? deposits.find(d => d.transactionHash === txHash)?.status
    : undefined

  const withdrawalStatus = isEvmTx
    ? withdrawals.find(w => w.transactionHash === txHash)?.status
    : undefined

  useEffect(
    function updateWrongQueryParameters() {
      if (!operation || (!isEvmTx && !isBtcTx)) {
        // if none are defined, ignore
        return
      }

      if (!isEvmTx && !isBtcTx) {
        // If txHash is invalid, return.
        // useTunnelOperation hook automatically takes care of clearing that query string value
        return
      }

      if (isEvmTx) {
        updateOperationQueryParameter({
          operation,
          operationByStatus: EvmOperationByMessageStatus,
          operationToIgnore: 'deposit',
          setQueryParams,
          status: withdrawalStatus,
        })
      } else {
        updateOperationQueryParameter({
          operation,
          operationByStatus: BtcOperationByStatus,
          operationToIgnore: 'withdraw',
          setQueryParams,
          status: depositBtcStatus,
        })
      }
    },
    [
      depositBtcStatus,
      isBtcTx,
      isEvmTx,
      withdrawalStatus,
      operation,
      setQueryParams,
    ],
  )

  const stateLoaded =
    !txHash || isBtcTx || (isEvmTx && withdrawalStatus !== undefined)

  return (
    <div className="h-fit-rest-screen">
      <Operation state={tunnelState} stateLoaded={stateLoaded} />
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <Tunnel />
    </Suspense>
  )
}
