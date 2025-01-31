'use client'

import { Big } from 'big.js'
import { useBalance } from 'btc-wallet/hooks/useBalance'
import { useAccounts } from 'hooks/useAccounts'
import { useBitcoin } from 'hooks/useBitcoin'
import { useDepositBitcoin } from 'hooks/useBtcTunnel'
import { useGetFeePrices } from 'hooks/useEstimateBtcFees'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { formatEvmAddress } from 'utils/format'
import { parseUnits } from 'viem'

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

// See https://github.com/hemilabs/ui-monorepo/issues/725
const minBitcoinDeposit = '0.01'

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
            minInputMsg={t('tunnel-page.form.min-deposit', {
              amount: minBitcoinDeposit,
              symbol: bitcoin.nativeCurrency.symbol,
            })}
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
            disabled={!canDeposit || isDepositing}
            text={t('tunnel-page.submit-button.deposit')}
          />
        }
      />
    </>
  )
}
