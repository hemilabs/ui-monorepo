'use client'

import { useUmami } from 'app/analyticsEvents'
import { DrawerLoader } from 'components/drawer/drawerLoader'
import { EvmFeesSummary } from 'components/evmFeesSummary'
import { useAccounts } from 'hooks/useAccounts'
import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useWithdrawBitcoin } from 'hooks/useBtcTunnel'
import { useChain } from 'hooks/useChain'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { isEvmNetwork } from 'utils/chain'
import { formatBtcAddress } from 'utils/format'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { parseTokenUnits, tunnelsThroughPartners } from 'utils/token'
import { walletIsConnected } from 'utils/wallet'
import { formatUnits } from 'viem'
import { useAccount } from 'wagmi'

import { useEstimateBtcWithdrawFees } from '../_hooks/useEstimateBtcWithdrawFees'
import { useEstimateWithdrawFees } from '../_hooks/useEstimateWithdrawFees'
import { useMinWithdrawalSats } from '../_hooks/useMinWithdrawalSats'
import {
  type EvmTunneling,
  type HemiToBitcoinTunneling,
  useTunnelState,
  type TypedTunnelState,
} from '../_hooks/useTunnelState'
import { useWithdraw } from '../_hooks/useWithdraw'
import { validateSubmit, getTotal } from '../_utils'

import { FeesContainer } from './feesContainer'
import { FormContent, TunnelForm } from './form'
import { ReceivingAddress } from './receivingAddress'
import { SubmitEvmWithdrawal } from './submitEvmWithdrawal'
import { SubmitWithTwoWallets } from './submitWithTwoWallets'
import { TunnelProviderToggle } from './tunnelProviderToggle'

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

const WalletsConnected = dynamic(
  () => import('./walletsConnected').then(mod => mod.WalletsConnected),
  { ssr: false },
)

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

  const { btcAddress, btcWalletStatus, evmChainId, evmWalletStatus } =
    useAccounts()
  const fromChain = useChain(fromNetworkId)

  const { isPending: isLoadingMinWithdrawalSats, minWithdrawalFormattedSats } =
    useMinWithdrawalSats(fromToken)
  const [networkType] = useNetworkType()
  const { balance: bitcoinBalance, isSuccess: balanceLoaded } = useTokenBalance(
    fromToken.chainId,
    fromToken.address,
  )
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

  const amount = parseTokenUnits(fromInput, fromToken)

  const handleWithdraw = function () {
    clearWithdrawBitcoinState()
    withdrawBitcoin({
      amount,
      l1ChainId: toNetworkId,
      l2ChainId: fromNetworkId,
    })
    setIsWithdrawing(true)
    track?.('btc - withdraw started', { chain: networkType })
  }

  const {
    canSubmit,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: fromInput,
    balance: bitcoinBalance,
    chainId: fromToken.chainId,
    expectedChain: fromChain.name,
    minAmount: minWithdrawalFormattedSats,
    operation: 'withdrawal',
    t,
    token: fromToken,
  })

  const canWithdraw = !isLoadingMinWithdrawalSats && canSubmit

  const { fees: estimatedFees, isError: isEstimateFeesError } =
    useEstimateBtcWithdrawFees({
      amount,
      btcAddress,
      enabled: !!btcAddress && canWithdraw,
      l2ChainId: evmChainId,
    })

  const gas = {
    amount: formatUnits(estimatedFees, fromChain?.nativeCurrency.decimals),
    isError: isEstimateFeesError,
    label: t('common.network-gas-fee', { network: fromChain?.name }),
    token: getNativeToken(fromChain.id),
  }

  const getSubmitText = function () {
    if (isWithdrawing) {
      return t('tunnel-page.submit-button.withdrawing')
    }
    return t('tunnel-page.submit-button.initiate-withdrawal')
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
          errorKey={
            walletIsConnected(btcWalletStatus) &&
            walletIsConnected(evmWalletStatus) &&
            balanceLoaded
              ? errorKey
              : undefined
          }
          isRunningOperation={isWithdrawing}
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
          text={getSubmitText()}
          validationError={validationError}
        />
      }
    />
  )
}

type EvmWithdrawProps = {
  state: TypedTunnelState<EvmTunneling>
}

const EvmWithdraw = function ({ state }: EvmWithdrawProps) {
  const [isPartnersDrawerOpen, setIsPartnersDrawerOpen] = useState(false)

  const t = useTranslations()

  const {
    fromInput,
    fromNetworkId,
    fromToken,
    providerType,
    resetStateAfterOperation,
    toggleTunnelProviderType,
    toNetworkId,
    toToken,
    updateFromInput,
  } = state

  const { chainId, status } = useAccount()

  const operatesNativeToken = isNativeToken(fromToken)

  const fromChain = useChain(fromNetworkId)

  const {
    balance: walletNativeTokenBalance,
    isSuccess: nativeTokenBalanceLoaded,
  } = useNativeTokenBalance(fromToken.chainId)

  const { balance: walletTokenBalance, isSuccess: tokenBalanceLoaded } =
    useTokenBalance(fromToken.chainId, fromToken.address)

  const [networkType] = useNetworkType()
  const isMainnet = networkType === 'mainnet'

  const {
    canSubmit: canWithdraw,
    error: validationError,
    errorKey,
  } = validateSubmit({
    amountInput: fromInput,
    balance: operatesNativeToken
      ? walletNativeTokenBalance
      : walletTokenBalance,
    chainId,
    expectedChain: fromChain.name,
    operation: 'withdrawal',
    t,
    token: fromToken,
  })

  const { fees: withdrawGasFees, isError: isEstimateFeesError } =
    useEstimateWithdrawFees({
      amount: parseTokenUnits(fromInput, fromToken),
      fromToken,
      l1ChainId: toToken.chainId,
    })

  const { isPending: isWithdrawing, mutate: withdraw } = useWithdraw({
    fromInput,
    fromToken,
    on(emitter) {
      emitter.on('withdraw-transaction-succeeded', () =>
        resetStateAfterOperation(),
      )
    },
    toToken,
  })

  const gas = {
    amount: formatUnits(withdrawGasFees, fromChain?.nativeCurrency.decimals),
    isError: isEstimateFeesError,
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

  const balanceLoaded = nativeTokenBalanceLoaded || tokenBalanceLoaded

  function RenderBelowForm() {
    if (!canWithdraw) return null

    return (
      <FeesContainer>
        <EvmFeesSummary
          gas={gas}
          operationToken={fromToken}
          total={totalDeposit}
        />
      </FeesContainer>
    )
  }

  function RenderTunnelProviderToggle() {
    if (!isMainnet) return null

    return (
      <TunnelProviderToggle
        fromNetworkId={fromNetworkId}
        providerType={providerType}
        toNetworkId={toNetworkId}
        toggleTunnelProviderType={toggleTunnelProviderType}
      />
    )
  }

  function RenderSubmitButton() {
    if (providerType !== 'native') return null

    return (
      <SubmitEvmWithdrawal
        canWithdraw={canWithdraw}
        fromToken={fromToken}
        isWithdrawing={isWithdrawing}
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
            isRunningOperation={isWithdrawing}
            provider={<RenderTunnelProviderToggle />}
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
        onSubmit={withdraw}
        submitButton={<RenderSubmitButton />}
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
