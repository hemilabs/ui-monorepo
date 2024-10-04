import { Button } from 'components/button'
import { useBtcDeposits } from 'hooks/useBtcDeposits'
import { useClaimBitcoinDeposit } from 'hooks/useBtcTunnel'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { useTunnelHistory } from 'hooks/useTunnelHistory'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { BtcDepositStatus } from 'types/tunnel'
import { getFormattedValue } from 'utils/format'
import { getTokenByAddress } from 'utils/token'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { SubmitWhenConnectedToChain } from '../_components/submitWhenConnectedToChain'
import { useShowTransactionFromPreviousStep } from '../_hooks/useShowTransactionFromPreviousStep'
import { useTransactionsList } from '../_hooks/useTransactionsList'
import { useTunnelOperation } from '../_hooks/useTunnelOperation'
import {
  type BtcToHemiTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'

import { ReviewBtcDeposit } from './reviewOperation/reviewBtcDeposit'

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

export const Claim = ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) => <BtcClaim state={state as TypedTunnelState<BtcToHemiTunneling>} />
