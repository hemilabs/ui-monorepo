'use client'

import { DrawerLoader } from 'components/drawer/drawerLoader'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useChain } from 'hooks/useChain'
import { useEstimateApproveErc20Fees } from 'hooks/useEstimateApproveErc20Fees'
import { useL1StandardBridgeAddress } from 'hooks/useL1StandardBridgeAddress'
import { useNeedsApproval } from 'hooks/useNeedsApproval'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { parseTokenUnits, tunnelsThroughPartners } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useDeposit } from '../_hooks/useDeposit'
import { useEstimateDepositFees } from '../_hooks/useEstimateDepositFees'
import { EvmTunneling, TypedTunnelState } from '../_hooks/useTunnelState'
import { validateSubmit, getTotal } from '../_utils'

import { Erc20TokenApproval } from './erc20TokenApproval'
import { FeesContainer } from './feesContainer'
import { FormContent, TunnelForm } from './form'
import { SubmitEvmDeposit } from './submitEvmDeposit'
import { TunnelProvider, TunnelProviderToggle } from './tunnelProviderToggle'

const CustomTunnelsThroughPartners = dynamic(
  () =>
    import('components/customTunnelsThroughPartners').then(
      mod => mod.CustomTunnelsThroughPartners,
    ),
  {
    loading: () => <DrawerLoader className="h-[45dvh] md:h-full" />,
    ssr: false,
  },
)

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

type OperationRunning = 'idle' | 'approving' | 'depositing'

type EvmDepositProps = {
  state: TypedTunnelState<EvmTunneling>
}

export const EvmDeposit = function ({ state }: EvmDepositProps) {
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')
  const [provider, setProvider] = useState<TunnelProvider>('native')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)
  const [networkType] = useNetworkType()
  const isMainnet = networkType === 'mainnet'

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toToken,
    updateFromInput,
  } = state

  const amount = parseTokenUnits(fromInput, fromToken)

  const { chain, status } = useEvmAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const {
    balance: walletNativeTokenBalance,
    isSuccess: nativeTokenBalanceLoaded,
  } = useNativeTokenBalance(fromToken.chainId)

  const l1StandardBridgeAddress = useL1StandardBridgeAddress(fromToken.chainId)

  const { isAllowanceError, isAllowanceLoading, needsApproval } =
    useNeedsApproval({
      address: fromToken.address,
      amount,
      spender: l1StandardBridgeAddress,
    })

  const { balance: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(fromToken.chainId, fromToken.address)

  const fromChain = useChain(fromNetworkId)

  const {
    canSubmit: canDeposit,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: fromInput,
    balance: operatesNativeToken
      ? walletNativeTokenBalance
      : walletTokenBalance,
    chainId: chain?.id,
    expectedChain: fromChain.name,
    operation: 'deposit',
    t,
    token: fromToken,
  })

  const { fees: approvalTokenGasFees, isError: isApprovalTokenGasFeesError } =
    useEstimateApproveErc20Fees({
      amount,
      spender: l1StandardBridgeAddress,
      token: fromToken,
    })

  const { fees: depositGasFees, isError: isDepositGasFeesError } =
    useEstimateDepositFees({
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

  const getTotalDeposit = () =>
    operatesNativeToken
      ? getTotal({
          fees: depositGasFees,
          fromInput,
          fromToken,
        })
      : getTotal({
          fromInput,
          fromToken,
        })

  const getGas = () => ({
    amount: formatUnits(
      depositGasFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
      fromChain?.nativeCurrency.decimals,
    ),
    isError:
      isDepositGasFeesError || (needsApproval && isApprovalTokenGasFeesError),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    token: getNativeToken(fromChain.id),
  })

  const balanceLoaded = nativeTokenBalanceLoaded || tokenBalanceLoaded

  function RenderBelowForm() {
    if (!canDeposit) return null

    return (
      <FeesContainer>
        <EvmFeesSummary
          gas={getGas()}
          operationToken={fromToken}
          total={getTotalDeposit()}
        />
      </FeesContainer>
    )
  }

  function RenderTunnelProviderToggle() {
    if (!isMainnet) return null

    return (
      <TunnelProviderToggle
        fromChainId={fromNetworkId}
        onChange={setProvider}
        provider={provider}
        toChainId={state.toNetworkId}
      />
    )
  }

  function RenderSubmitButton() {
    if (provider !== 'native') return null

    return (
      <SubmitEvmDeposit
        canDeposit={canDeposit}
        fromToken={fromToken}
        isAllowanceError={isAllowanceError}
        isAllowanceLoading={isAllowanceLoading}
        isRunningOperation={isRunningOperation}
        needsApproval={needsApproval}
        operationRunning={operationRunning}
        setIsPartnersDrawerOpen={setIsPartnersDrawerOpen}
        validationError={validationError}
      />
    )
  }

  return (
    <>
      <TunnelForm
        belowForm={<RenderBelowForm />}
        formContent={
          <FormContent
            errorKey={
              walletIsConnected(status) && balanceLoaded ? errorKey : undefined
            }
            isRunningOperation={isRunningOperation}
            provider={provider}
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
            tunnelProviderToggle={<RenderTunnelProviderToggle />}
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
        submitButton={<RenderSubmitButton />}
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
