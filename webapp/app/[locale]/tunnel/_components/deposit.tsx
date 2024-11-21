'use client'

import { useUmami } from 'app/analyticsEvents'
import { Big } from 'big.js'
import { useBalance as useBtcBalance } from 'btc-wallet/hooks/useBalance'
import { Button } from 'components/button'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { isEvmNetwork } from 'utils/chain'
import { formatEvmAddress, formatNumber } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits, parseUnits } from 'viem'
import { useAccount as useEvmAccount } from 'wagmi'

import { useDeposit } from '../_hooks/useDeposit'
import {
  type BtcToHemiTunneling,
  type EvmTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'
import { canSubmit, getTotal } from '../_utils'

import { BtcFees } from './btcFees'
import { ConnectEvmWallet } from './connectEvmWallet'
import { Erc20TokenApproval } from './erc20TokenApproval'
import { EvmSummary } from './evmSummary'
import { FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'

const minBitcoinDeposit = '0.01'

type OperationRunning = 'idle' | 'approving' | 'depositing'

const SetMaxBtcBalance = dynamic(
  () => import('./setMaxBalance').then(mod => mod.SetMaxBtcBalance),
  { ssr: false },
)

const SetMaxEvmBalance = dynamic(
  () => import('./setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

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

type BtcDepositProps = {
  state: TypedTunnelState<BtcToHemiTunneling>
}

const BtcDeposit = function ({ state }: BtcDepositProps) {
  const [isDepositing, setIsDepositing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    updateFromInput,
  } = state

  const { evmAddress } = useAccounts()
  const bitcoin = useBitcoin()
  const { balance } = useBtcBalance()

  // TODO we need to let the user know about the min value to deposit
  // See https://github.com/hemilabs/ui-monorepo/issues/454
  const canDeposit =
    canSubmit({
      balance: BigInt(balance?.confirmed ?? 0),
      chainId: bitcoin.id,
      fromInput,
      fromNetworkId,
      fromToken,
    }) && Big(fromInput).gte(minBitcoinDeposit)

  const {
    clearDepositState,
    depositBitcoin,
    depositError,
    depositReceipt,
    depositReceiptError,
  } = useDepositBitcoin()

  const t = useTranslations()

  useEffect(
    function handleSuccess() {
      if (!depositReceipt?.status.confirmed || !isDepositing) {
        return
      }
      setIsDepositing(false)
      resetStateAfterOperation()
    },
    [depositReceipt, isDepositing, resetStateAfterOperation, setIsDepositing],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if (isDepositing && (depositError || depositReceiptError)) {
        setIsDepositing(false)
      }
    },
    [depositError, depositReceiptError, isDepositing, setIsDepositing],
  )

  const { feePrices } = useGetFeePrices()

  const handleDeposit = function () {
    if (!canDeposit) {
      return
    }
    clearDepositState()
    setIsDepositing(true)
    depositBitcoin({
      hemiAddress: evmAddress,
      l1ChainId: fromNetworkId,
      l2ChainId: toNetworkId,
      satoshis: Number(parseUnits(fromInput, fromToken.decimals)),
    })
  }

  const fees = feePrices?.fastestFee?.toString()

  return (
    <>
      <TunnelForm
        belowForm={
          <div className="relative -z-10 -translate-y-7">
            <ReceivingAddress
              address={evmAddress ? formatEvmAddress(evmAddress) : undefined}
              receivingText={t('tunnel-page.form.hemi-receiving-address')}
              tooltipText={t(
                'tunnel-page.form.hemi-receiving-address-description',
                {
                  symbol: state.fromToken.symbol,
                },
              )}
            />
            {fees !== undefined ? <BtcFees fees={fees} /> : null}
          </div>
        }
        bottomSection={<WalletsConnected />}
        formContent={
          <FormContent
            isRunningOperation={isDepositing}
            setMaxBalanceButton={
              <SetMaxBtcBalance
                fromToken={fromToken}
                isRunningOperation={isDepositing}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
              />
            }
            tunnelState={state}
          />
        }
        onSubmit={handleDeposit}
        submitButton={
          <SubmitWithTwoWallets
            disabled={!canDeposit || isDepositing}
            text={t('tunnel-page.submit-button.deposit')}
          />
        }
      />
    </>
  )
}

type EvmDepositProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmDeposit = function ({ state }: EvmDepositProps) {
  const [networkType] = useNetworkType()
  // use this to be able to show state boxes before user confirmation (mutation isn't finished)
  const [operationRunning, setOperationRunning] =
    useState<OperationRunning>('idle')

  // use this state to toggle the Erc20 token approval
  const [extendedErc20Approval, setExtendedErc20Approval] = useState(false)

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
    amount: formatNumber(
      formatUnits(
        depositGasFees + (needsApproval ? approvalTokenGasFees : BigInt(0)),
        fromChain?.nativeCurrency.decimals,
      ),
      3,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  return (
    <TunnelForm
      belowForm={
        canDeposit ? (
          <EvmSummary
            gas={gas}
            operationSymbol={fromToken.symbol}
            total={totalDeposit}
          />
        ) : null
      }
      formContent={
        <FormContent
          isRunningOperation={isRunningOperation}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              fromToken={fromToken}
              gas={depositGasFees}
              isRunningOperation={isRunningOperation}
              onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
            />
          }
          tokenApproval={
            operatesNativeToken ? null : (
              <Erc20TokenApproval
                checked={extendedErc20Approval}
                disabled={!needsApproval || isRunningOperation}
                onCheckedChange={() => setExtendedErc20Approval(prev => !prev)}
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
              state.updateFromToken(from, to)
            },
          }}
        />
      }
      onSubmit={handleDeposit}
      submitButton={
        walletIsConnected(status) ? (
          <SubmitEvmDeposit
            canDeposit={canDeposit}
            isRunningOperation={isRunningOperation}
            needsApproval={needsApproval}
            operationRunning={operationRunning}
          />
        ) : (
          <ConnectEvmWallet />
        )
      }
    />
  )
}

export const Deposit = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { fromNetworkId } = state
  const chain = useNetworks().remoteNetworks.find(n => n.id === fromNetworkId)

  if (!chain) {
    return (
      <Skeleton
        className="h-[475px] max-w-[536px]"
        containerClassName="flex justify-center"
      />
    )
  }

  // Typescript can't infer it, but we can cast these safely
  if (isEvmNetwork(chain)) {
    return <EvmDeposit state={state as TypedTunnelState<EvmTunneling>} />
  }
  return <BtcDeposit state={state as TypedTunnelState<BtcToHemiTunneling>} />
}
