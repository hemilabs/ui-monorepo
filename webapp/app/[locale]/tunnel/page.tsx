'use client'

import { MessageStatus } from '@eth-optimism/sdk'
import { ConnectWallet } from 'components/connectWallet'
import { TunnelHistoryContext } from 'context/tunnelHistoryContext'
import { useConnectedToUnsupportedEvmChain } from 'hooks/useConnectedToUnsupportedChain'
import { useTranslations } from 'next-intl'
import { Suspense, useContext, useEffect } from 'react'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
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

const OperationByMessageStatus = {
  [MessageStatus.UNCONFIRMED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.FAILED_L1_TO_L2_MESSAGE]: 'withdraw',
  [MessageStatus.STATE_ROOT_NOT_PUBLISHED]: 'prove',
  [MessageStatus.READY_TO_PROVE]: 'prove',
  [MessageStatus.IN_CHALLENGE_PERIOD]: 'claim',
  [MessageStatus.READY_FOR_RELAY]: 'claim',
  [MessageStatus.RELAYED]: 'view',
}

const Tunnel = function () {
  const { status } = useAccount()
  const { withdrawals } = useContext(TunnelHistoryContext)
  const tunnelState = useTunnelState()
  const { operation, txHash } = useTunnelOperation()
  const t = useTranslations()
  const { setQueryParams } = useQueryParams()

  const messageStatus = withdrawals.find(w => w.transactionHash === txHash)
    ?.status

  useEffect(
    function updateWithdrawOperationComponentPerMessageStatus() {
      if (
        operation === 'deposit' ||
        !messageStatus ||
        (!operation && !txHash)
      ) {
        return
      }
      const newOperation = OperationByMessageStatus[messageStatus]
      if (operation !== newOperation) {
        setQueryParams({ operation: newOperation })
      }
    },
    [messageStatus, operation, setQueryParams, txHash],
  )

  const connectedToUnsupportedChain = useConnectedToUnsupportedEvmChain()

  const stateLoaded = !txHash || messageStatus !== undefined
  const OperationComponent = stateLoaded ? OperationsComponent[operation] : null

  return (
    <div className="h-fit-rest-screen">
      {stateLoaded && OperationComponent && (
        <OperationComponent state={tunnelState} />
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
