'use client'

import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useBitcoinBalance } from 'hooks/useBitcoinBalance'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useUmami } from 'hooks/useUmami'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatEvmAddress } from 'utils/format'
import { parseTokenUnits } from 'utils/token'
import { validateSubmit } from 'utils/validateSubmit'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'

import { useBtcDepositTunnelFees } from '../_hooks/useBtcTunnelFees'
import { useMinDepositSats } from '../_hooks/useMinDepositSats'
import { BtcToHemiTunneling, TypedTunnelState } from '../_hooks/useTunnelState'

import { BtcFees } from './btcFees'
import { FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'

const SetMaxBtcBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxBtcBalance),
  { ssr: false },
)

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

type BtcDepositProps = {
  state: TypedTunnelState<BtcToHemiTunneling>
}

export const BtcDeposit = function ({ state }: BtcDepositProps) {
  const [isDepositing, setIsDepositing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    updateFromInput,
  } = state

  const { btcChainId, btcWalletStatus, evmAddress } = useAccounts()
  const bitcoin = useBitcoin()
  const { balance, isSuccess: balanceLoaded } = useBitcoinBalance()
  const { isPending: isMinDepositsSatsLoading, minDepositFormattedSats } =
    useMinDepositSats()
  const t = useTranslations()
  const { track } = useUmami()

  const {
    canSubmit,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: fromInput,
    balance: BigInt(balance?.confirmed ?? 0),
    chainId: btcChainId,
    expectedChain: bitcoin.name,
    minAmount: minDepositFormattedSats,
    operation: 'deposit',
    t,
    token: fromToken,
  })

  const canDeposit = !isMinDepositsSatsLoading && canSubmit && evmAddress

  const amountBigInt = parseTokenUnits(fromInput, fromToken)

  const {
    btcDepositFee,
    isError: isTunnelFeeError,
    isLoading: isLoadingTunnelFee,
  } = useBtcDepositTunnelFees(amountBigInt)

  const {
    clearDepositState,
    depositBitcoin,
    depositError,
    depositReceipt,
    depositReceiptError,
  } = useDepositBitcoin()

  useEffect(
    function handleSuccess() {
      if (!depositReceipt?.status.confirmed || !isDepositing) {
        return
      }
      setIsDepositing(false)
      resetStateAfterOperation()
      track?.('btc - dep success')
    },
    [
      depositReceipt,
      isDepositing,
      resetStateAfterOperation,
      setIsDepositing,
      track,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if (isDepositing && (depositError || depositReceiptError)) {
        setIsDepositing(false)
        if (depositReceiptError) {
          track?.('btc - dep failed')
        }
      }
    },
    [depositError, depositReceiptError, isDepositing, setIsDepositing, track],
  )

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
      satoshis: Number(parseTokenUnits(fromInput, fromToken)),
    })
    track?.('btc - dep started')
  }

  const calculateReceiveAmount = function () {
    if (amountBigInt === BigInt(0)) {
      return '0'
    }
    if (isTunnelFeeError) {
      return '-'
    }
    if (isLoadingTunnelFee) {
      return '...'
    }

    return formatUnits(
      amountBigInt - (btcDepositFee ?? BigInt(0)),
      fromToken.decimals,
    )
  }

  return (
    <>
      <TunnelForm
        belowForm={
          <div className="relative -translate-y-7">
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
            <BtcFees amount={amountBigInt} />
          </div>
        }
        bottomSection={<WalletsConnected />}
        formContent={
          <FormContent
            calculateReceiveAmount={calculateReceiveAmount}
            errorKey={
              walletIsConnected(btcWalletStatus) && balanceLoaded
                ? errorKey
                : undefined
            }
            isRunningOperation={isDepositing}
            setMaxBalanceButton={
              <SetMaxBtcBalance
                disabled={isDepositing}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
                token={fromToken}
              />
            }
            tunnelState={state}
          />
        }
        onSubmit={handleDeposit}
        submitButton={
          <SubmitWithTwoWallets
            disabled={!canDeposit || isDepositing || isMinDepositsSatsLoading}
            text={isDepositing ? t('common.depositing') : t('common.deposit')}
            validationError={validationError}
          />
        }
      />
    </>
  )
}
