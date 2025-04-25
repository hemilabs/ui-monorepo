'use client'

import { Button } from 'components/button'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { Spinner } from 'components/spinner'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useL1StandardBridgeAddress } from 'hooks/useL1StandardBridgeAddress'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { tunnelsThroughPartners } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits, parseUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useDeposit } from '../_hooks/useDeposit'
import { useEstimateDepositFees } from '../_hooks/useEstimateDepositFees'
import { EvmTunneling, TypedTunnelState } from '../_hooks/useTunnelState'
import { canSubmit, getTotal } from '../_utils'

import { ConnectEvmWallet } from './connectEvmWallet'
import { Erc20TokenApproval } from './erc20TokenApproval'
import { FeesContainer } from './feesContainer'
import { FormContent, TunnelForm } from './form'

const CustomTunnelsThroughPartners = dynamic(
  () =>
    import('components/customTunnelsThroughPartners').then(
      mod => mod.CustomTunnelsThroughPartners,
    ),
  { ssr: false },
)

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
  isAllowanceLoading,
  isRunningOperation,
  needsApproval,
  operationRunning,
}: {
  canDeposit: boolean
  isAllowanceLoading: boolean
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
    if (isAllowanceLoading) {
      return <Spinner size={'small'} />
    }
    // TODO Se need to handle allowanceStatus === 'error, see https://github.com/hemilabs/ui-monorepo/pull/1125
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
    <Button
      disabled={!canDeposit || isRunningOperation || isAllowanceLoading}
      type="submit"
    >
      {getOperationButtonText()}
    </Button>
  )
}

export const EvmDeposit = function ({ state }: EvmDepositProps) {
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toToken,
    updateFromInput,
  } = state

  const amount = parseUnits(fromInput, fromToken.decimals)

  const { chain, status } = useEvmAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const l1StandardBridgeAddress = useL1StandardBridgeAddress(fromToken.chainId)

  const { isAllowanceLoading, needsApproval } = useNeedsApproval({
    address: fromToken.address,
    amount,
    spender: l1StandardBridgeAddress,
  })

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken.chainId,
    fromToken.address,
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

  const approvalTokenGasFees = useEstimateFees({
    chainId: fromToken.chainId,
    operation: 'approve-erc20',
    overEstimation: 1.5,
  })

  const depositGasFees = useEstimateDepositFees({
    amount,
    fromToken,
    toToken,
  })

  const { isPending: isRunningOperation, mutate: deposit } = useDeposit({
    extendedErc20Approval,
    fromInput,
    fromToken,
    on(emitter) {
      emitter.on('approve-transaction-succeeded', () =>
        setOperationRunning('depositing'),
      )
      emitter.on('deposit-transaction-succeeded', function () {
        resetStateAfterOperation()
        setExtendedErc20Approval(false)
      })
      emitter.on('deposit-settled', () => setOperationRunning('idle'))
    },
    toToken,
  })

  const handleDeposit = function () {
    deposit()
    if (needsApproval) {
      setOperationRunning('approving')
    } else {
      setOperationRunning('depositing')
    }
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
    if (tunnelsThroughPartners(fromToken)) {
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
          isAllowanceLoading={isAllowanceLoading}
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
                if (tunnelsThroughPartners(from)) {
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
        <CustomTunnelsThroughPartners
          fromToken={fromToken}
          onClose={() => setIsPartnersDrawerOpen(false)}
          operation="deposit"
          toToken={toToken}
        />
      )}
    </>
  )
}
