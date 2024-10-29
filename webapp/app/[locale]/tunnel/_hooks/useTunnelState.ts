import { featureFlags } from 'app/featureFlags'
import { type BtcChain } from 'btc-wallet/chains'
import { BtcTransaction } from 'btc-wallet/unisat'
import { useBitcoin } from 'hooks/useBitcoin'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { type RemoteChain } from 'types/chain'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { findChainById } from 'utils/chain'
import { getNativeToken, getTokenByAddress } from 'utils/token'
import { type NoPayload, type Payload } from 'utils/typeUtilities'
import { type Chain, type Hash, isHash } from 'viem'

import { useTunnelOperation } from './useTunnelOperation'

export type Operation = 'claim' | 'deposit' | 'prove' | 'withdraw' | 'view'

export type TunnelState = {
  fromInput: string
  fromNetworkId: RemoteChain['id']
  fromToken: Token
  partialDeposit?: Partial<{
    depositTxHash: BtcTransaction
    claimDepositTxHash: Hash
  }>
  toNetworkId: RemoteChain['id']
  toToken: Token
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload

type SavePartialDeposit = Action<'savePartialDeposit'> &
  Payload<TunnelState['partialDeposit']>
type UpdateFromNetwork = Action<'updateFromNetwork'> &
  Payload<TunnelState['fromNetworkId']>
type UpdateFromToken = Action<'updateFromToken'> &
  Payload<TunnelState['fromToken']>
type UpdateFromInput = Action<'updateFromInput'> & Payload<string>
type UpdateToNetwork = Action<'updateToNetwork'> &
  Payload<TunnelState['toNetworkId']>
type ToggleInput = Action<'toggleInput'> & NoPayload
type ToggleTestnetMainnet = Action<'toggleTestnetMainnet'> &
  Payload<Pick<TunnelState, 'fromNetworkId' | 'toNetworkId'>>

type Actions =
  | ResetStateAfterOperation
  | SavePartialDeposit
  | UpdateFromNetwork
  | UpdateFromInput
  | UpdateFromToken
  | UpdateToNetwork
  | ToggleInput
  | ToggleTestnetMainnet

// the _:never is used to fail compilation if a case is missing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compilationError = function (_: never): never {
  throw new Error('Missing implementation of action in reducer')
}

const reducer = function (state: TunnelState, action: Actions): TunnelState {
  const { type } = action
  switch (type) {
    case 'resetStateAfterOperation': {
      const newState = {
        ...state,
        fromInput: '0',
      }
      return newState
    }
    case 'savePartialDeposit': {
      return {
        ...state,
        partialDeposit: {
          ...(state.partialDeposit || {}),
          ...action.payload,
        },
      }
    }
    case 'updateFromNetwork': {
      const { payload: fromNetworkId } = action
      return {
        ...state,
        fromNetworkId,
      }
    }
    case 'updateFromToken': {
      const { payload: fromToken } = action
      const { toNetworkId } = state

      const bridgeAddress =
        fromToken.extensions?.bridgeInfo[toNetworkId]?.tokenAddress
      // find the tunneled pair of the token, or go with the native if missing
      const toToken =
        (bridgeAddress && getTokenByAddress(bridgeAddress, toNetworkId)) ??
        getNativeToken(toNetworkId)
      return {
        ...state,
        fromToken,
        toNetworkId,
        toToken,
      }
    }
    case 'updateFromInput': {
      const { payload: value } = action
      // if input ends with a dot, add a zero so it is a valid number.
      const fromInput = value === '' ? '0' : value
      return {
        ...state,
        fromInput: fromInput.startsWith('.') ? `0${fromInput}` : fromInput,
      }
    }
    case 'updateToNetwork': {
      const { payload: toNetworkId } = action
      return {
        ...state,
        toNetworkId,
        toToken: getNativeToken(toNetworkId),
      }
    }
    case 'toggleInput': {
      const { toToken: newFromToken } = state
      const newState = {
        ...state,
        fromNetworkId: state.toNetworkId,
        fromToken: newFromToken,
        toNetworkId: state.fromNetworkId,
        toToken: state.fromToken,
      }

      return newState
    }
    case 'toggleTestnetMainnet': {
      return {
        ...state,
        ...action.payload,
        fromToken: getNativeToken(action.payload.fromNetworkId),
        toToken: getNativeToken(action.payload.toNetworkId),
      }
    }
    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

const getDefaultNetworksOrder = function ({
  bitcoin,
  hemi,
  l1ChainId,
  tunnelOperation,
}: {
  bitcoin: BtcChain
  hemi: Chain
  l1ChainId: Chain['id']
  tunnelOperation: ReturnType<typeof useTunnelOperation>
}) {
  const { operation, txHash } = tunnelOperation
  const bitcoinFromL1ToL2 = {
    fromNetworkId: bitcoin.id,
    toNetworkId: hemi.id,
  }
  const evmFromL1ToL2 = {
    fromNetworkId: l1ChainId,
    toNetworkId: hemi.id,
  }
  const evmFromL2ToL1 = {
    fromNetworkId: hemi.id,
    toNetworkId: l1ChainId,
  }

  const pickOption = (
    evmAlternative: Record<string, Chain['id']>,
    btcAlternative: Record<string, RemoteChain['id']>,
  ) =>
    // if no hash, hash is an EVM one, or btc are disabled, return EVM alternative
    !txHash || isHash(txHash) || !featureFlags.btcTunnelEnabled
      ? evmAlternative
      : btcAlternative

  if (!operation) {
    // no operation in query string, default to EVM deposit
    return evmFromL1ToL2
  }
  if (!['claim', 'deposit'].includes(operation)) {
    // for non-deposits, the withdrawals work ok
    // Needs to be updated once btc withdrawals are enabled
    // https://github.com/hemilabs/ui-monorepo/issues/343
    return evmFromL2ToL1
  }
  if (operation === 'claim') {
    return pickOption(evmFromL2ToL1, bitcoinFromL1ToL2)
  }
  if (operation === 'deposit') {
    return pickOption(evmFromL1ToL2, bitcoinFromL1ToL2)
  }
  // default just in case, but I think it is unreachable as all cases must be covered above.
  // However, let's be defensive and prevent the app from crashing
  return evmFromL1ToL2
}

// This will throw compile error if a proper function event is missing!
// But toggleTestnetMainnet is internal for a useEffect, no need to expose it
type TunnelFunctionEvents = {
  [K in Exclude<Actions['type'], 'toggleTestnetMainnet'>]: (
    payload?: Extract<Actions, { type: K }>['payload'],
  ) => void
}

export const useTunnelState = function (): TunnelState & TunnelFunctionEvents {
  const bitcoin = useBitcoin()
  const hemi = useHemi()
  const { evmRemoteNetworks, networks } = useNetworks()
  const [networkType] = useNetworkType()
  const tunnelOperation = useTunnelOperation()

  // See https://github.com/hemilabs/ui-monorepo/issues/158
  const l1ChainId = evmRemoteNetworks[0].id

  const initial = useMemo(
    () =>
      getDefaultNetworksOrder({
        bitcoin,
        hemi,
        l1ChainId,
        tunnelOperation,
      }),
    [bitcoin, hemi, l1ChainId, tunnelOperation],
  )

  const [state, dispatch] = useReducer(reducer, {
    fromInput: '0',
    fromToken: getNativeToken(initial.fromNetworkId),
    toToken: getNativeToken(initial.toNetworkId),
    ...initial,
  } as TunnelState)

  const updateFromInput = useCallback(
    function (payload: UpdateFromInput['payload']) {
      // verify if input is a valid number
      const validationRegex = /^\d*\.?\d*$/
      if (!validationRegex.test(payload)) {
        return
      }
      dispatch({
        payload: payload.replace(/^0+/, ''),
        type: 'updateFromInput',
      })
    },
    [dispatch],
  )

  const { operation } = tunnelOperation

  const isTestnet = findChainById(state.fromNetworkId)?.testnet ?? false

  useEffect(
    function () {
      if ((networkType === 'testnet') !== isTestnet) {
        dispatch({
          payload: {
            fromNetworkId: initial.fromNetworkId,
            toNetworkId: initial.toNetworkId,
          },
          type: 'toggleTestnetMainnet',
        })
      }
    },
    [dispatch, initial, isTestnet, networkType],
  )

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [dispatch],
    ),
    savePartialDeposit: useCallback(
      (payload: SavePartialDeposit['payload']) =>
        dispatch({
          payload,
          type: 'savePartialDeposit',
        }),
      [dispatch],
    ),
    toggleInput: useCallback(
      function () {
        const newOperation = operation === 'deposit' ? 'withdraw' : 'deposit'
        tunnelOperation.updateTxHash(null)
        tunnelOperation.updateOperation(newOperation)
        dispatch({ type: 'toggleInput' })
      },
      [dispatch, operation, tunnelOperation],
    ),
    updateFromInput,
    updateFromNetwork: useCallback(
      function (fromNetworkId: UpdateFromNetwork['payload']) {
        // update network
        dispatch({ payload: fromNetworkId, type: 'updateFromNetwork' })
        // given the upload, we may need to update the tokens
        const nativeToken = getNativeToken(fromNetworkId)
        dispatch({ payload: nativeToken, type: 'updateFromToken' })
      },
      [dispatch],
    ),
    updateFromToken: useCallback(
      function (fromToken: UpdateFromToken['payload']) {
        // if the selected token can't be tunneled to the target chain
        // we need to first update the target network
        if (!fromToken.extensions?.bridgeInfo[state.toNetworkId]) {
          // just grab the first available network that's enabled
          const [newFromNetworkId] = Object.keys(
            fromToken.extensions.bridgeInfo,
          ).filter(id => networks.some(n => n.id.toString() === id))
          // parse as int or keep as string, depending on the id
          const payload = (
            isNaN(parseInt(newFromNetworkId))
              ? newFromNetworkId
              : parseInt(newFromNetworkId)
          ) as TunnelState['fromNetworkId']
          dispatch({
            payload,
            type: 'updateToNetwork',
          })
        }
        dispatch({ payload: fromToken, type: 'updateFromToken' })
      },
      [dispatch, networks, state],
    ),
    updateToNetwork: useCallback(
      function (toNetworkId: UpdateToNetwork['payload']) {
        // update network
        dispatch({ payload: toNetworkId, type: 'updateToNetwork' })
        // if we're updating the "To", it means Hemi is on the "From" network
        // so the "From" must be updated to the tunnel equivalent in Hemi.
        const tunneledEthHemi = getNativeToken(hemi.id)
        const nativeToken = getNativeToken(toNetworkId)
        const newToken = nativeToken.extensions?.bridgeInfo[hemi.id]
          ?.tokenAddress
          ? getTokenByAddress(
              nativeToken.extensions.bridgeInfo[hemi.id].tokenAddress,
              hemi.id,
            ) ?? tunneledEthHemi
          : tunneledEthHemi

        dispatch({ payload: newToken, type: 'updateFromToken' })
      },
      [dispatch, hemi.id],
    ),
  }
}

// EVM L1 <=> HEMI L2
export type EvmTunneling = {
  fromNetworkId: Chain['id']
  fromToken: EvmToken
  toNetworkId: Chain['id']
  toToken: EvmToken
}

// BTC L1 => Hemi L2
export type BtcToHemiTunneling = {
  fromNetworkId: BtcChain['id']
  fromToken: BtcToken
  toNetworkId: Chain['id']
  toToken: EvmToken
}

// Hemi L2 => BTC L1
export type HemiToBitcoinTunneling = {
  fromNetworkId: Chain['id']
  fromToken: EvmToken
  toNetworkId: BtcChain['id']
  toToken: BtcToken
}

type TunnelingOperations =
  | EvmTunneling
  | BtcToHemiTunneling
  | HemiToBitcoinTunneling

// Use this to narrow down in each operation to better typing, depending on the "fromNetworkId"
export type TypedTunnelState<T extends TunnelingOperations> = ReturnType<
  typeof useTunnelState
> &
  T
