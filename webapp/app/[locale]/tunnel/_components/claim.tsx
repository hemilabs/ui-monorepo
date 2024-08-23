import { MessageStatus } from '@eth-optimism/sdk'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useClaimBitcoinDeposit } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useGetClaimWithdrawalTxHash } from 'hooks/useL2Bridge'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { BtcDepositStatus, EvmWithdrawOperation } from 'types/tunnel'
import { Button } from 'ui-common/components/button'
import { getFormattedValue } from 'utils/format'
import { getTokenByAddress } from 'utils/token'
import { Chain, formatUnits, type Hash, isHash } from 'viem'
import { useAccount } from 'wagmi'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useClaimTransaction } from '../_hooks/useClaimTransaction'
import { useShowTransactionFromPreviousStep } from '../_hooks/useShowTransactionFromPreviousStep'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type EvmTunneling,
  type BtcToHemiTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'

import { ReviewBtcDeposit } from './reviewOperation/reviewBtcDeposit'
import { ReviewEvmWithdrawal } from './reviewOperation/reviewEvmWithdrawal'

const EvmSubmitButton = function ({
  claimTxHash: inMemoryClaimTxHash,
  l1ChainId,
  isClaiming,
  isReadyToClaim,
  withdrawal,
}: {
  claimTxHash: Hash | undefined
  l1ChainId: Chain['id']
  isClaiming: boolean
  isReadyToClaim: boolean
  withdrawal: EvmWithdrawOperation
}) {
  const t = useTranslations()
  const txHash = useTunnelOperation().txHash as Hash

  const { claimTxHash } = useGetClaimWithdrawalTxHash(l1ChainId, txHash)
  const { status: messageStatus } = withdrawal

  const hasClaimTxHash = !!inMemoryClaimTxHash || !!claimTxHash

  // Even though the Tx is confirmed, it takes a while to the OP-SDK
  // to confirm that the message was relayed, even after revalidating the queries
  // so it is better to check for this instead of the existence of the claimTxHash
  const claimConfirmed =
    messageStatus === MessageStatus.RELAYED && hasClaimTxHash

  return (
    <SubmitWhenConnectedToChain
      chainId={l1ChainId}
      submitButton={
        <Button
          disabled={!isReadyToClaim || isClaiming || claimConfirmed}
          type="submit"
        >
          {t(
            `tunnel-page.submit-button.${
              isClaiming || (!claimConfirmed && hasClaimTxHash)
                ? 'claiming-withdrawal'
                : 'claim-withdrawal'
            }`,
          )}
        </Button>
      }
    />
  )
}

const BtcSubmitButton = function ({
  isClaiming,
  isReadyToClaim,
}: {
  isClaiming: boolean
  isReadyToClaim: boolean
}) {
  const hemi = useHemi()
  const t = useTranslations('tunnel-page.submit-button')

  const disabled = isClaiming || !isReadyToClaim

  return (
    <SubmitWhenConnectedToChain
      chainId={hemi.id}
      submitButton={
        <Button disabled={disabled} type="submit">
          {isClaiming && t('claiming-deposit')}
          {!isClaiming && t('claim-deposit')}
        </Button>
      }
    />
  )
}

const ConfirmBtcDepositGasUnits = BigInt(400_000)

export const BtcClaim = function ({
  state,
}: {
  state: TypedTunnelState<BtcToHemiTunneling>
}) {
  const { partialDeposit, savePartialDeposit } = state
  const { chain, isConnected } = useAccount()
  const deposits = useBtcDeposits()
  const {
    claimBitcoinDeposit,
    claimBitcoinDepositReceipt,
    claimBitcoinDepositError,
    claimBitcoinDepositReceiptError,
    claimBitcoinDepositTxHash,
    clearClaimBitcoinDepositState,
  } = useClaimBitcoinDeposit()
  const hemi = useHemi()
  const estimatedFees = useEstimateFees({
    chainId: hemi.id,
    enabled: isConnected,
    gasUnits: ConfirmBtcDepositGasUnits,
    overEstimation: 1.5,
  })
  const t = useTranslations()
  const { updateDeposit } = useTunnelHistory()
  const { txHash } = useTunnelOperation()

  const [isClaiming, setIsClaiming] = useState(false)

  // If coming from the Deposit form, show the deposit transaction briefly
  // but if entering from the history, there's no need to show it
  const showDepositTx = useShowTransactionFromPreviousStep(
    partialDeposit?.depositTxHash,
  )

  const deposit = deposits.find(d => d.transactionHash === txHash)

  useEffect(
    function handleClaimSuccess() {
      if (claimBitcoinDepositReceipt?.status !== 'success') {
        return
      }
      if (deposit.status !== BtcDepositStatus.BTC_READY_CLAIM) {
        return
      }
      updateDeposit(deposit, { status: BtcDepositStatus.BTC_DEPOSITED })
      savePartialDeposit({
        claimDepositTxHash: claimBitcoinDepositReceipt.transactionHash,
      })
    },
    [claimBitcoinDepositReceipt, deposit, savePartialDeposit, updateDeposit],
  )

  useEffect(
    function handleClaimErrors() {
      if (
        !isClaiming ||
        (!claimBitcoinDepositError && !claimBitcoinDepositReceiptError)
      ) {
        return undefined
      }
      const timeoutId = setTimeout(clearClaimBitcoinDepositState, 7000)
      setIsClaiming(false)
      return () => clearTimeout(timeoutId)
    },
    [
      claimBitcoinDepositError,
      claimBitcoinDepositReceiptError,
      clearClaimBitcoinDepositState,
      isClaiming,
      setIsClaiming,
    ],
  )

  const isReadyToClaim = deposit.status === BtcDepositStatus.BTC_READY_CLAIM

  const handleClaim = function () {
    if (!isReadyToClaim) {
      return
    }
    clearClaimBitcoinDepositState()
    claimBitcoinDeposit(deposit)
    setIsClaiming(true)
  }

  const depositedToken = getTokenByAddress(deposit.l1Token, deposit.l1ChainId)

  const getPartialDepositTxList = () => [
    {
      id: 'deposit',
      status: 'success',
      text: t('tunnel-page.transaction-status.deposited', {
        fromInput: getFormattedValue(
          formatUnits(BigInt(deposit.amount), depositedToken.decimals),
        ),
        symbol: depositedToken.symbol,
      }),
      txHash: partialDeposit?.depositTxHash,
    },
  ]

  const transactionsList = useTransactionsList({
    inProgressMessage: t('tunnel-page.transaction-status.claiming-deposit'),
    isOperating: isClaiming,
    operation: 'claim',
    receipt: claimBitcoinDepositReceipt,
    receiptError: claimBitcoinDepositReceiptError,
    successMessage: t('tunnel-page.transaction-status.deposit-claimed'),
    txHash: claimBitcoinDepositTxHash,
    userConfirmationError: claimBitcoinDepositError,
  })

  const fees = isConnected
    ? {
        amount: formatUnits(estimatedFees, hemi.nativeCurrency.decimals),
        symbol: hemi.nativeCurrency.symbol,
      }
    : undefined

  return (
    <ReviewBtcDeposit
      chain={chain}
      fees={fees}
      isRunningOperation={isClaiming}
      onClose={clearClaimBitcoinDepositState}
      onSubmit={handleClaim}
      submitButton={
        <BtcSubmitButton
          isClaiming={isClaiming}
          isReadyToClaim={isReadyToClaim}
        />
      }
      token={depositedToken}
      transactionsList={
        showDepositTx && partialDeposit
          ? getPartialDepositTxList()
          : transactionsList
      }
    />
  )
}

type EvmClaimProps = {
  state: TypedTunnelState<EvmTunneling>
}

export const EvmClaim = function ({ state }: EvmClaimProps) {
  const { evmRemoteNetworks } = useNetworks()
  const { updateWithdrawal, withdrawals } = useTunnelHistory()
  const { partialWithdrawal, resetStateAfterOperation, savePartialWithdrawal } =
    state

  const [isClaiming, setIsClaiming] = useState(false)

  // https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const txHash = useTunnelOperation().txHash as Hash
  const t = useTranslations()

  const fromChain = useChain(l1ChainId)

  const {
    claimWithdrawal,
    claimWithdrawalError,
    claimWithdrawalReceipt,
    claimWithdrawalReceiptError,
    claimWithdrawalTokenGasFees,
    claimWithdrawalTxHash,
    clearClaimWithdrawalState,
    isReadyToClaim,
  } = useClaimTransaction({
    l1ChainId,
    withdrawTxHash: txHash,
  })

  const withdrawal = withdrawals.find(w => w.transactionHash === txHash)

  // If coming from the Prove form, show the prove transaction briefly
  // but if entering from the history, there's no need to show it
  const showProveWithdrawalTx = useShowTransactionFromPreviousStep(
    partialWithdrawal?.proveWithdrawalTxHash,
  )

  useEffect(
    function updateWithdrawalAfterConfirmation() {
      if (claimWithdrawalReceipt?.status !== 'success') {
        return
      }

      if (withdrawal?.status === MessageStatus.RELAYED) {
        return
      }
      updateWithdrawal(withdrawal, { status: MessageStatus.RELAYED })
      savePartialWithdrawal({
        claimWithdrawalTxHash: claimWithdrawalReceipt.transactionHash,
      })
    },
    [
      claimWithdrawalReceipt,
      savePartialWithdrawal,
      txHash,
      updateWithdrawal,
      withdrawal,
      withdrawals,
    ],
  )

  useEffect(
    function handleClaimErrors() {
      if (isClaiming && (claimWithdrawalError || claimWithdrawalReceiptError)) {
        const timeoutId = setTimeout(clearClaimWithdrawalState, 7000)
        setIsClaiming(false)
        return () => clearTimeout(timeoutId)
      }
      return undefined
    },
    [
      claimWithdrawalError,
      claimWithdrawalReceiptError,
      clearClaimWithdrawalState,
      isClaiming,
      isReadyToClaim,
      setIsClaiming,
    ],
  )

  const handleClaim = function () {
    if (!isReadyToClaim) {
      return
    }
    clearClaimWithdrawalState()
    claimWithdrawal()
    setIsClaiming(true)
  }

  const transactionsList = useTransactionsList({
    expectedWithdrawSuccessfulMessageStatus: MessageStatus.RELAYED,
    inProgressMessage: t('tunnel-page.transaction-status.claiming-withdrawal'),
    isOperating: isClaiming,
    operation: 'claim',
    receipt: claimWithdrawalReceipt,
    receiptError: claimWithdrawalReceiptError,
    successMessage: t('tunnel-page.transaction-status.withdrawal-claimed'),
    txHash: claimWithdrawalTxHash,
    userConfirmationError: claimWithdrawalError,
  })

  const gas = {
    amount: formatUnits(
      claimWithdrawalTokenGasFees,
      fromChain?.nativeCurrency.decimals,
    ),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  const submitButton = (
    <EvmSubmitButton
      claimTxHash={claimWithdrawalTxHash}
      isClaiming={isClaiming}
      isReadyToClaim={isReadyToClaim}
      l1ChainId={l1ChainId}
      withdrawal={withdrawal}
    />
  )

  return (
    <ReviewEvmWithdrawal
      gas={gas}
      isRunningOperation={isClaiming}
      onClose={resetStateAfterOperation}
      onSubmit={handleClaim}
      submitButton={submitButton}
      transactionsList={
        showProveWithdrawalTx
          ? [
              {
                id: 'prove',
                status: 'success',
                text: t('tunnel-page.transaction-status.withdrawal-proved'),
                txHash: partialWithdrawal?.proveWithdrawalTxHash,
              },
            ]
          : transactionsList
      }
    />
  )
}

export const Claim = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { txHash } = useTunnelOperation()

  // Typescript can't infer it, but we can cast these safely
  if (isHash(txHash)) {
    return <EvmClaim state={state as TypedTunnelState<EvmTunneling>} />
  }
  return <BtcClaim state={state as TypedTunnelState<BtcToHemiTunneling>} />
}
