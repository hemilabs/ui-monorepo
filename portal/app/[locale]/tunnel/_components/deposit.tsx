'use client'

import { useNetworks } from 'hooks/useNetworks'
import Skeleton from 'react-loading-skeleton'
import { isEvmNetwork } from 'utils/chain'

import {
  type BtcToHemiTunneling,
  type EvmTunneling,
  useTunnelState,
  TypedTunnelState,
} from '../_hooks/useTunnelState'

import { BtcDeposit } from './btcDeposit'
import { EvmDeposit } from './evmDeposit'

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
