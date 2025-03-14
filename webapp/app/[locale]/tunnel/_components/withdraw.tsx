'use client'

import { useUmami } from 'app/analyticsEvents'
import { Big } from 'big.js'
import { Button } from 'components/button'
import { CustomTunnelsThroughPartners } from 'components/customTunnelsThroughPartners'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { isEvmNetwork } from 'utils/chain'
import { formatBtcAddress } from 'utils/format'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { tunnelsThroughPartners } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits, parseUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useMinWithdrawalSats } from '../_hooks/useMinWithdrawalSats'
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
  const estimatedFees = useEstimateFees({
    chainId: fromNetworkId,
    operation: 'withdraw-btc',
  })
  const { minWithdrawalFormattedSats, isPending: isLoadingMinWithdrawalSats } =
    useMinWithdrawalSats(fromToken)
  const [networkType] = useNetworkType()
  const { balance: bitcoinBalance } = useTokenBalance(fromToken)
  const t = useTranslations()
  const { track } = useUmami()
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
      track?.('btc - withdraw success', { chain: networkType })
    },
    [
      isWithdrawing,
      networkType,
      resetStateAfterOperation,
      setIsWithdrawing,
      track,
      withdrawBitcoinReceipt,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if ((withdrawError || withdrawBitcoinReceiptError) && isWithdrawing) {
        setIsWithdrawing(false)
        if (withdrawBitcoinReceiptError) {
          track?.('btc - withdraw failed', { chain: networkType })
        }
      }
    },
    [
      isWithdrawing,
      networkType,
      setIsWithdrawing,
      track,
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
    track?.('btc - withdraw started', { chain: networkType })
  }

  const canWithdraw =
    !isLoadingMinWithdrawalSats &&
    canSubmit({
      balance: bitcoinBalance,
      chainId: evmChainId,
      fromInput,
      fromNetworkId,
      fromToken,
    }) &&
    Big(fromInput).gte(minWithdrawalFormattedSats)

  const gas = {
    amount: formatUnits(estimatedFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    token: getNativeToken(fromChain.id),
  }

  return (
    <TunnelForm
      belowForm={
        <div className="relative -translate-y-7">
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
                operationToken={fromToken}
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
          minInputMsg={{
            loading: isLoadingMinWithdrawalSats,
            value: isLoadingMinWithdrawalSats
              ? ''
              : t('tunnel-page.form.min-withdrawal', {
                  amount: minWithdrawalFormattedSats,
                  symbol: fromToken.symbol,
                }),
          }}
          setMaxBalanceButton={
            <SetMaxEvmBalance
              disabled={isWithdrawing}
              gas={estimatedFees}
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
  const [networkType] = useNetworkType()
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)

  const t = useTranslations()
  const { track } = useUmami()

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
      track?.('evm - init withdraw success', { chain: networkType })
    },
    [
      isWithdrawing,
      networkType,
      resetStateAfterOperation,
      setIsWithdrawing,
      track,
      withdrawReceipt,
    ],
  )

  useEffect(
    function handleRejectionOrFailure() {
      if ((withdrawError || withdrawReceiptError) && isWithdrawing) {
        setIsWithdrawing(false)
        if (withdrawReceiptError) {
          track?.('evm - init withdraw failed', { chain: networkType })
        }
      }
    },
    [
      isWithdrawing,
      networkType,
      setIsWithdrawing,
      track,
      withdrawError,
      withdrawReceiptError,
    ],
  )

  const handleWithdraw = function () {
    clearWithdrawState()
    withdraw()
    setIsWithdrawing(true)
    track?.('evm - init withdraw started', { chain: networkType })
  }
  const gas = {
    amount: formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals),
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    token: getNativeToken(fromChain.id),
  }

  const totalDeposit = operatesNativeToken
    ? getTotal({
        fees: withdrawGasFees,
        fromInput,
        fromToken,
      })
    : getTotal({
        fromInput,
        fromToken,
      })

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
                operationToken={fromToken}
                total={totalDeposit}
              />
            </FeesContainer>
          ) : null
        }
        formContent={
          <FormContent
            isRunningOperation={isWithdrawing}
            setMaxBalanceButton={
              <SetMaxEvmBalance
                disabled={isWithdrawing}
                gas={withdrawGasFees}
                onSetMaxBalance={maxBalance => updateFromInput(maxBalance)}
                token={fromToken}
              />
            }
            tunnelState={{
              ...state,
              updateFromToken(from, to) {
                if (tunnelsThroughPartners(from)) {
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
        <CustomTunnelsThroughPartners
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
