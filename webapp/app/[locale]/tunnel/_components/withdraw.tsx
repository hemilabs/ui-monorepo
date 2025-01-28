'use client'

import { Big } from 'big.js'
import { Button } from 'components/button'
import {
  CustomTunnelsThroughPartner,
  tunnelsThroughPartner,
} from 'components/customTunnelsThroughPartner'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useEstimateBtcWithdrawFees } from 'hooks/useEstimateBtcWithdrawFees'
import { useNetworks } from 'hooks/useNetworks'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { isEvmNetwork } from 'utils/chain'
import { formatBtcAddress } from 'utils/format'
import { isNativeToken } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import {
  type EvmTunneling,
  type HemiToBitcoinTunneling,
  useTunnelState,
  type TypedTunnelState,
} from '../_hooks/useTunnelState'
import { useWithdraw } from '../_hooks/useWithdraw'
import { canSubmit, getTotal } from '../_utils'

import { ConnectEvmWallet } from './connectEvmWallet'
import { FeesContainer } from './feesContainer'
import { FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'

const minBitcoinWithdraw = '0.01'

const SetMaxEvmBalance = dynamic(
  () => import('components/setMaxBalance').then(mod => mod.SetMaxEvmBalance),
  { ssr: false },
)

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

const hasBridgeConfiguration = (token: Token, l1ChainId: RemoteChain['id']) =>
  isNativeToken(token) ||
  token.extensions?.bridgeInfo[l1ChainId].tokenAddress !== undefined

type BtcWithdrawProps = {
  state: TypedTunnelState<HemiToBitcoinTunneling>
}

const BtcWithdraw = function ({ state }: BtcWithdrawProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    toToken,
    updateFromInput,
  } = state

  const { btcAddress, evmChainId } = useAccounts()
  const fromChain = useChain(fromNetworkId)
  const estimatedFees = useEstimateBtcWithdrawFees(fromNetworkId)
  const { balance: bitcoinBalance } = useTokenBalance(fromToken)
  const t = useTranslations()
  const {
    clearWithdrawBitcoinState,
    withdrawBitcoin,
    withdrawBitcoinReceipt,
    withdrawBitcoinReceiptError,
    withdrawError,
  } = useWithdrawBitcoin()

  useEffect(
    function handleSuccess() {
      if (withdrawBitcoinReceipt?.status !== 'success' || !isWithdrawing) {
        return
      }
      setIsWithdrawing(false)
      resetStateAfterOperation()
    },
    [
      resetStateAfterOperation,
      setIsWithdrawing,
      isWithdrawing,
      withdrawBitcoinReceipt,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if ((withdrawError || withdrawBitcoinReceiptError) && isWithdrawing) {
        setIsWithdrawing(false)
      }
    },
    [
      isWithdrawing,
      setIsWithdrawing,
      withdrawBitcoinReceiptError,
      withdrawError,
    ],
  )

  const handleWithdraw = function () {
    clearWithdrawBitcoinState()
    withdrawBitcoin({
      amount: parseUnits(fromInput, fromToken.decimals),
      l1ChainId: toNetworkId,
      l2ChainId: fromNetworkId,
    })
    setIsWithdrawing(true)
  }

  const canWithdraw =
    canSubmit({
      balance: bitcoinBalance,
      chainId: evmChainId,
      fromInput,
      fromNetworkId,
      fromToken,
    }) && Big(fromInput).gte(minBitcoinWithdraw)

  const gas = {
    amount: formatUnits(estimatedFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
  }

  return (
    <TunnelForm
      belowForm={
        <div className="relative -z-10 -translate-y-7">
          <ReceivingAddress
            address={btcAddress ? formatBtcAddress(btcAddress) : undefined}
            receivingText={t('tunnel-page.form.bitcoin-receiving-address')}
            tooltipText={t(
              'tunnel-page.form.bitcoin-receiving-address-description',
              {
                symbol: toToken.symbol,
              },
            )}
          />
          {canWithdraw ? (
            <FeesContainer>
              <EvmFeesSummary
                gas={gas}
                operationSymbol={fromToken.symbol}
                total={getTotal({
                  fromInput,
                  fromToken,
                })}
              />
            </FeesContainer>
          ) : null}
        </div>
      }
      bottomSection={<WalletsConnected />}
      formContent={
        <FormContent
          isRunningOperation={isWithdrawing}
          minInputMsg={t('tunnel-page.form.min-withdraw', {
            amount: minBitcoinWithdraw,
            symbol: fromToken.symbol,
          })}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              gas={estimatedFees}
              isRunningOperation={isWithdrawing}
              onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
              token={fromToken}
            />
          }
          tunnelState={state}
        />
      }
      onSubmit={handleWithdraw}
      submitButton={
        <SubmitWithTwoWallets
          disabled={!canWithdraw || isWithdrawing}
          text={
            isWithdrawing
              ? t('tunnel-page.submit-button.withdrawing')
              : t('tunnel-page.submit-button.initiate-withdrawal')
          }
        />
      }
    />
  )
}

type EvmWithdrawProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmWithdraw = function ({ state }: EvmWithdrawProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    resetStateAfterOperation,
    toNetworkId,
    toToken,
    updateFromInput,
  } = state

  const { chainId, status } = useAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = useChain(fromNetworkId)

  const { balance: walletNativeTokenBalance } = useNativeTokenBalance(
    fromToken.chainId,
  )

  const { balance: walletTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const canWithdraw =
    canSubmit({
      balance: operatesNativeToken
        ? walletNativeTokenBalance
        : walletTokenBalance,
      chainId,
      fromInput,
      fromNetworkId,
      fromToken,
    }) && hasBridgeConfiguration(fromToken, toNetworkId)

  const {
    clearWithdrawState,
    withdraw,
    withdrawError,
    withdrawGasFees,
    withdrawReceipt,
    withdrawReceiptError,
  } = useWithdraw({
    canWithdraw,
    fromInput,
    fromToken,
    l1ChainId: toNetworkId,
    l2ChainId: fromNetworkId,
    toToken,
  })

  useEffect(
    function handleSuccess() {
      if (withdrawReceipt?.status !== 'success' || !isWithdrawing) {
        return
      }
      setIsWithdrawing(false)
      resetStateAfterOperation()
    },
    [
      isWithdrawing,
      resetStateAfterOperation,
      setIsWithdrawing,
      withdrawReceipt,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if ((withdrawError || withdrawReceiptError) && isWithdrawing) {
        setIsWithdrawing(false)
      }
    },
    [isWithdrawing, setIsWithdrawing, withdrawError, withdrawReceiptError],
  )

  const handleWithdraw = function () {
    clearWithdrawState()
    withdraw()
    setIsWithdrawing(true)
  }
  const gas = {
    amount: formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    symbol: fromChain?.nativeCurrency.symbol,
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
        <Button disabled={!canWithdraw || isWithdrawing} type="submit">
          {t(
            `tunnel-page.submit-button.${
              isWithdrawing ? 'withdrawing' : 'initiate-withdrawal'
            }`,
          )}
        </Button>
      )
    }

    return <ConnectEvmWallet />
  }

  return (
    <>
      <TunnelForm
        belowForm={
          canWithdraw ? (
            <FeesContainer>
              <EvmFeesSummary
                gas={gas}
                operationSymbol={fromToken.symbol}
                total={fromInput}
              />
            </FeesContainer>
          ) : null
        }
        formContent={
          <FormContent
            isRunningOperation={isWithdrawing}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                gas={withdrawGasFees}
                isRunningOperation={isWithdrawing}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
                token={fromToken}
              />
            }
            tunnelState={{
              ...state,
              updateFromToken(from, to) {
                if (tunnelsThroughPartner(from)) {
                  setIsPartnersDrawerOpen(true)
                }
                state.updateFromToken(from, to)
              },
            }}
          />
        }
        onSubmit={handleWithdraw}
        submitButton={getSubmitButton()}
      />
      {isPartnersDrawerOpen && (
        <CustomTunnelsThroughPartner
          fromToken={fromToken}
          onClose={() => setIsPartnersDrawerOpen(false)}
          operation="withdraw"
          toToken={toToken}
        />
      )}
    </>
  )
}

export const Withdraw = function ({
  state,
}: {
  state: ReturnType<typeof useTunnelState>
}) {
  const { toNetworkId } = state
  const toChain = useNetworks().remoteNetworks.find(n => n.id === toNetworkId)

  if (!toChain) {
    return (
      <Skeleton
        className="h-[475px] max-w-[536px]"
        containerClassName="flex justify-center"
      />
    )
  }

  // Typescript can't infer it, but we can cast these safely
  if (isEvmNetwork(toChain)) {
    return <EvmWithdraw state={state as TypedTunnelState<EvmTunneling>} />
  }
  return (
    <BtcWithdraw state={state as TypedTunnelState<HemiToBitcoinTunneling>} />
  )
}
