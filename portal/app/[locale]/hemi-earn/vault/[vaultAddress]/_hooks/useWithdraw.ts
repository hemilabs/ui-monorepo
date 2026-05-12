import { useEnsureConnectedTo } from '@hemilabs/react-hooks/useEnsureConnectedTo'
import { useNativeBalance } from '@hemilabs/react-hooks/useNativeBalance'
import { useUpdateNativeBalanceAfterReceipt } from '@hemilabs/react-hooks/useUpdateNativeBalanceAfterReceipt'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EventEmitter } from 'events'
import {
  type RequestRedeemEvents,
  getHemiEarnRouterAddress,
} from 'hemi-earn-actions'
import { requestRedeem } from 'hemi-earn-actions/actions'
import { useTokenBalance } from 'hooks/useBalance'
import { parseTokenUnits } from 'utils/token'
import { useAccount, useConfig } from 'wagmi'
import { getWalletClient } from 'wagmi/actions'

import { earnPoolsKeyPrefix } from '../../../_hooks/useEarnPools'
import { earnPositionsKeyPrefix } from '../../../_hooks/useEarnPositions'
import { totalDepositsKeyPrefix } from '../../../_hooks/useTotalDeposits'
import { type EarnPool } from '../../../types'
import {
  type VaultWithdrawOperation,
  VaultWithdrawStatus,
} from '../_types/vaultOperations'

import { useDrawerVaultQueryString } from './useDrawerVaultQueryString'
import { getUserVaultBalanceQueryKey } from './useUserVaultBalance'

type UseWithdraw = {
  input: string
  on?: (emitter: EventEmitter<RequestRedeemEvents>) => void
  pool: EarnPool
  updateWithdrawOperation: (payload?: VaultWithdrawOperation) => void
}

// TODO(phase-2): `fulfillmentFee` is the LayerZero composeValue used for the
// return message. See the matching note in `useDeposit.ts`.
const FULFILLMENT_FEE = BigInt(0)

export const useWithdraw = function ({
  input,
  on,
  pool,
  updateWithdrawOperation,
}: UseWithdraw) {
  const { setDrawerQueryString } = useDrawerVaultQueryString()
  const { address } = useAccount()
  const chainId = pool.token.chainId
  const config = useConfig()
  const ensureConnectedTo = useEnsureConnectedTo()
  const queryClient = useQueryClient()
  const routerAddress = getHemiEarnRouterAddress()

  const { queryKey: tokenBalanceQueryKey } = useTokenBalance(
    chainId,
    pool.token.address,
  )

  const { queryKey: nativeTokenBalanceQueryKey } = useNativeBalance(chainId)

  const updateNativeBalanceAfterFees =
    useUpdateNativeBalanceAfterReceipt(chainId)

  return useMutation({
    async mutationFn() {
      if (!address) {
        throw new Error('No account connected')
      }

      await ensureConnectedTo(chainId)

      const walletClient = await getWalletClient(config, { chainId })

      // The user input is in asset units (hemiBTC/WBTC/cbBTC, 8 decimals) but
      // the Router expects `shares` in 18-decimal units. This call is
      // intentionally wrong on phase 1 — it will revert on the live Router
      // because the magnitude is off by ~10^10 and the value semantically
      // represents an asset amount, not a share amount.
      //
      // TODO(phase-2): replace with the real asset → shares conversion:
      //   const assetAmount  = parseTokenUnits(input, pool.token)            // 8-dec, asset
      //   const vetBTCAmount = await gateway.previewWithdraw(remoteAsset, assetAmount)  // 18-dec
      //   const sharesNeeded = await stakingVault.convertToShares(vetBTCAmount)         // 18-dec
      // Then submit `requestRedeem(asset, sharesNeeded, ...)`.
      const shares = parseTokenUnits(input, pool.token)

      const { emitter, promise } = requestRedeem({
        account: address,
        asset: pool.vaultAddress,
        fulfillmentFee: FULFILLMENT_FEE,
        receiver: address,
        routerAddress,
        shares,
        walletClient,
      })

      emitter.on('user-signed-withdraw', function (transactionHash) {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_PENDING,
          transactionHash,
        })
        setDrawerQueryString('withdrawing')
      })

      emitter.on('user-signing-withdraw-error', function () {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      emitter.on('withdraw-transaction-succeeded', function (receipt) {
        // TODO(phase-2): when the share tracker is implemented, parse the
        // `RedeemRequested` log to capture the requestId. For now we trust the
        // receipt; mocked reads return placeholders on invalidation.
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_CONFIRMED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('withdraw-transaction-reverted', function (receipt) {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
        updateNativeBalanceAfterFees(receipt)
      })

      emitter.on('withdraw-failed-validation', function () {
        updateWithdrawOperation({
          status: VaultWithdrawStatus.WITHDRAW_TX_FAILED,
        })
      })

      on?.(emitter)

      return promise
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: tokenBalanceQueryKey })
      queryClient.invalidateQueries({ queryKey: nativeTokenBalanceQueryKey })
      queryClient.invalidateQueries({
        queryKey: earnPoolsKeyPrefix,
      })
      queryClient.invalidateQueries({
        queryKey: getUserVaultBalanceQueryKey({
          chainId,
          vaultAddress: pool.vaultAddress,
        }),
      })
      queryClient.invalidateQueries({
        queryKey: earnPositionsKeyPrefix,
      })
      queryClient.invalidateQueries({
        queryKey: totalDepositsKeyPrefix,
      })
    },
  })
}
