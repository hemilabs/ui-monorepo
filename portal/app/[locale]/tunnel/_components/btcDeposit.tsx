'use client'

import { useUmami } from 'app/analyticsEvents'
import { Big } from 'big.js'
import { useBalance } from 'btc-wallet/hooks/useBalance'
import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatEvmAddress } from 'utils/format'
import { parseUnits } from 'viem'

import { useMinDepositSats } from '../_hooks/useMinDepositSats'
import { BtcToHemiTunneling, TypedTunnelState } from '../_hooks/useTunnelState'
import { canSubmit } from '../_utils'

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

  const { evmAddress } = useAccounts()
  const bitcoin = useBitcoin()
  const { balance } = useBalance()
  const { isPending: isMinDepositsSatsLoading, minDepositFormattedSats } =
    useMinDepositSats()
  const [networkType] = useNetworkType()
  const { track } = useUmami()

  const canDeposit =
    !isMinDepositsSatsLoading &&
    canSubmit({
      balance: BigInt(balance?.confirmed ?? 0),
      chainId: bitcoin.id,
      fromInput,
      fromNetworkId,
      fromToken,
    }) &&
    Big(fromInput).gte(minDepositFormattedSats)

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
      track?.('btc - dep success', { chain: networkType })
    },
    [
      depositReceipt,
      isDepositing,
      networkType,
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
          track?.('btc - dep failed', { chain: networkType })
        }
      }
    },
    [
      depositError,
      depositReceiptError,
      networkType,
      isDepositing,
      setIsDepositing,
      track,
    ],
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
    track?.('btc - dep started', { chain: networkType })
  }

  const fees = feePrices?.fastestFee?.toString()

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
            {fees !== undefined ? <BtcFees fees={fees} /> : null}
          </div>
        }
        bottomSection={<WalletsConnected />}
        formContent={
          <FormContent
            isRunningOperation={isDepositing}
            minInputMsg={{
              loading: isMinDepositsSatsLoading,
              value: t('tunnel-page.form.min-deposit', {
                amount: minDepositFormattedSats,
                symbol: bitcoin.nativeCurrency.symbol,
              }),
            }}
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
            text={t('tunnel-page.submit-button.deposit')}
          />
        }
      />
    </>
  )
}
