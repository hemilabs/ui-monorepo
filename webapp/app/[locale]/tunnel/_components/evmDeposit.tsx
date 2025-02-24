'use client'

import { useUmami } from 'app/analyticsEvents'
import { Button } from 'components/button'
import { CustomTunnelsThroughPartner } from 'components/customTunnelsThroughPartner'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { tunnelsThroughPartner } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useDeposit } from '../_hooks/useDeposit'
import { EvmTunneling, TypedTunnelState } from '../_hooks/useTunnelState'
import { canSubmit, getTotal } from '../_utils'

import { ConnectEvmWallet } from './connectEvmWallet'
import { Erc20TokenApproval } from './erc20TokenApproval'
import { FeesContainer } from './feesContainer'
import { FormContent, TunnelForm } from './form'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type OperationRunning = 'idle' | 'approving' | 'depositing'

type EvmDepositProps = {
  state: TypedTunnelState<EvmTunneling>
}

const SubmitEvmDeposit = function ({
  canDeposit,
  isRunningOperation,
  needsApproval,
  operationRunning,
}: {
  canDeposit: boolean
  isRunningOperation: boolean
  needsApproval: boolean
  operationRunning: OperationRunning
}) {
  const t = useTranslations()

  const getOperationButtonText = function () {
    const texts = {
      approve: {
        idle: t('tunnel-page.submit-button.approve-and-deposit'),
        loading: t('tunnel-page.submit-button.approving'),
      },
      deposit: {
        idle: t('tunnel-page.submit-button.deposit'),
        loading: t('tunnel-page.submit-button.depositing'),
      },
    }
    if (!isRunningOperation) {
      return texts[needsApproval ? 'approve' : 'deposit'].idle
    }
    if (operationRunning === 'approving') {
      return texts.approve.loading
    }
    if (operationRunning === 'depositing') {
      return texts.deposit.loading
    }
    return texts.deposit.idle
  }

  return (
    <Button disabled={!canDeposit || isRunningOperation} type="submit">
      {getOperationButtonText()}
    </Button>
  )
}

export const EvmDeposit = function ({ state }: EvmDepositProps) {
  const [networkType] = useNetworkType()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)

  const t = useTranslations()
  const { track } = useUmami()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toToken,
    updateFromInput,
  } = state

  const { chain, status } = useEvmAccount()
  const operatesNativeToken = isNativeToken(fromToken)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canDeposit = canSubmit({
    balance: operatesNativeToken
      ? walletNativeTokenBalance
      : walletTokenBalance,
    chainId: chain?.id,
    fromInput,
    fromNetworkId,
    fromToken,
  })

  const fromChain = useChain(fromNetworkId)

  const {
    approvalError,
    approvalReceipt,
    approvalReceiptError,
    approvalTokenGasFees = BigInt(0),
    clearDepositState,
    needsApproval,
    deposit,
    depositError,
    depositGasFees,
    depositReceipt,
    depositReceiptError,
  } = useDeposit({
    canDeposit,
    extendedErc20Approval: operatesNativeToken
      ? undefined
      : extendedErc20Approval,
    fromInput,
    fromToken,
    toToken,
  })

  const approvalReceiptStatus = approvalReceipt?.status
  useEffect(
    function handleApprovalSuccess() {
      if (
        approvalReceiptStatus === 'success' &&
        operationRunning === 'approving'
      ) {
        setOperationRunning('depositing')
      }
    },
    [approvalReceiptStatus, operationRunning, setOperationRunning],
  )

  useEffect(
    function handleSuccess() {
      if (
        depositReceipt?.status !== 'success' ||
        operationRunning !== 'depositing'
      ) {
        return
      }
      setOperationRunning('idle')
      resetStateAfterOperation()
      setExtendedErc20Approval(false)
      track?.('evm - dep success', { chain: networkType })
    },
    [
      depositReceipt,
      networkType,
      operationRunning,
      resetStateAfterOperation,
      setExtendedErc20Approval,
      setOperationRunning,
      track,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if (
        (approvalError ||
          approvalReceiptError ||
          depositError ||
          depositReceiptError) &&
        operationRunning !== 'idle'
      ) {
        setOperationRunning('idle')
        track?.('evm - dep failed', { chain: networkType })
      }
    },
    [
      approvalError,
      approvalReceiptError,
      networkType,
      depositError,
      depositReceiptError,
      operationRunning,
      setOperationRunning,
      track,
    ],
  )

  const isRunningOperation = operationRunning !== 'idle'

  const handleDeposit = function () {
    clearDepositState()
    deposit()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('depositing')
    }
    track?.('evm - dep started', { chain: networkType })
  }

  const totalDeposit = operatesNativeToken
    ? getTotal({
        fees: depositGasFees,
        fromInput,
        fromToken,
      })
    : getTotal({
        fromInput,
        fromToken,
      })

  const gas = {
    amount: formatUnits(
      depositGasFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
      fromChain?.nativeCurrency.decimals,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    token: getNativeToken(fromChain.id),
  }

  const getSubmitButton = function () {
    if (tunnelsThroughPartner(fromToken)) {
      return (
        <Button onClick={() => setIsPartnersDrawerOpen(true)} type="button">
          {t('tunnel-page.tunnel-partners.tunnel-with-our-partners')}
        </Button>
      )
    }
    if (walletIsConnected(status)) {
      return (
        <SubmitEvmDeposit
          canDeposit={canDeposit}
          isRunningOperation={isRunningOperation}
          needsApproval={needsApproval}
          operationRunning={operationRunning}
        />
      )
    }
    return <ConnectEvmWallet />
  }

  return (
    <>
      <TunnelForm
        belowForm={
          canDeposit ? (
            <FeesContainer>
              <EvmFeesSummary
                gas={gas}
                operationToken={fromToken}
                total={totalDeposit}
              />
            </FeesContainer>
          ) : null
        }
        formContent={
          <FormContent
            isRunningOperation={isRunningOperation}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                disabled={isRunningOperation}
                gas={depositGasFees}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
                token={fromToken}
              />
            }
            tokenApproval={
              operatesNativeToken ? null : (
                <Erc20TokenApproval
                  checked={extendedErc20Approval}
                  disabled={!needsApproval || isRunningOperation}
                  onCheckedChange={() =>
                    setExtendedErc20Approval(prev => !prev)
                  }
                />
              )
            }
            tunnelState={{
              ...state,
              // patch these events to update the extendedErc20Approval state
              toggleInput() {
                // toToken becomes fromToken, so we must check that one
                if (isNativeToken(state.toToken)) {
                  setExtendedErc20Approval(false)
                }
                state.toggleInput()
              },
              updateFromNetwork(payload: number) {
                setExtendedErc20Approval(false)
                state.updateFromNetwork(payload)
              },
              updateFromToken(from, to) {
                if (isNativeToken(from)) {
                  setExtendedErc20Approval(false)
                }
                if (tunnelsThroughPartner(from)) {
                  setIsPartnersDrawerOpen(true)
                }
                state.updateFromToken(from, to)
              },
            }}
          />
        }
        onSubmit={handleDeposit}
        submitButton={getSubmitButton()}
      />
      {isPartnersDrawerOpen && (
        <CustomTunnelsThroughPartner
          fromToken={fromToken}
          onClose={() => setIsPartnersDrawerOpen(false)}
          operation="deposit"
          toToken={toToken}
        />
      )}
    </>
  )
}
