import { type BtcChain } from 'btc-wallet/chains'
import { useBitcoin } from 'hooks/useBitcoin'
import { useHemi } from 'hooks/useHemi'
import { useNetworks } from 'hooks/useNetworks'
import { useTunnelTokens } from 'hooks/useTunnelTokens'
import { useCallback, useLayoutEffect, useMemo, useReducer } from 'react'
import { type RemoteChain } from 'types/chain'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { findChainById } from 'utils/chain'
import { sanitizeAmount } from 'utils/form'
import { getNativeToken, isNativeToken } from 'utils/nativeToken'
import { getTokenByAddress } from 'utils/token'
import { type NoPayload, type Payload } from 'utils/typeUtilities'
import { type Chain, isHash } from 'viem'

import { useTunnelOperation } from './useTunnelOperation'

export type Operation = 'claim' | 'deposit' | 'prove' | 'withdraw' | 'view'
type TunnelProviderType = 'native' | 'thirdParty'

export type TunnelState = {
  fromInput: string
  fromNetworkId: RemoteChain['id']
  fromToken: Token
  toNetworkId: RemoteChain['id']
  toToken: Token
  providerType: TunnelProviderType
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload

type UpdateFromNetwork = Action<'updateFromNetwork'> &
  Payload<TunnelState['fromNetworkId']>
type UpdateFromToken = Action<'updateFromToken'> &
  Payload<{
    fromToken: TunnelState['fromToken']
    toToken: TunnelState['toToken']
  }>
type UpdateFromInput = Action<'updateFromInput'> & Payload<string>
type UpdateToNetwork = Action<'updateToNetwork'> &
  Payload<TunnelState['toNetworkId']>
type ToggleInput = Action<'toggleInput'> & NoPayload
type ToggleTestnetMainnet = Action<'toggleTestnetMainnet'> &
  Payload<Pick<TunnelState, 'fromNetworkId' | 'toNetworkId'>>
type ToggleTunnelProviderType = Action<'toggleTunnelProviderType'> &
  Payload<TunnelProviderType>

type Actions =
  | ResetStateAfterOperation
  | UpdateFromNetwork
  | UpdateFromInput
  | UpdateFromToken
  | UpdateToNetwork
  | ToggleInput
  | ToggleTestnetMainnet
  | ToggleTunnelProviderType

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
    case 'updateFromNetwork': {
      const { payload: fromNetworkId } = action
      return {
        ...state,
        fromNetworkId,
      }
    }
    case 'updateFromToken': {
      const { fromToken, toToken } = action.payload

      return {
        ...state,
        fromToken,
        toToken,
      }
    }
    case 'updateFromInput': {
      const { payload: fromInput } = action
      return {
        ...state,
        fromInput,
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
        providerType: 'native', // reset provider to native on network switch
        toToken: getNativeToken(action.payload.toNetworkId),
      }
    }
    case 'toggleTunnelProviderType': {
      return {
        ...state,
        providerType: action.payload,
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
    // if no hash or hash is an EVM one, return EVM alternative
    !txHash || isHash(txHash) ? evmAlternative : btcAlternative

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
// and updateFromToken uses a different interface
type TunnelFunctionEvents = {
  [K in Exclude<
    Actions['type'],
    'toggleTestnetMainnet' | 'updateFromToken'
  >]: Extract<Actions, { type: K }> extends NoPayload
    ? () => void
    : (payload: Extract<Actions, { type: K }>['payload']) => void
} & {
  updateFromToken: (
    fromToken: TunnelState['fromToken'],
    toToken?: TunnelState['toToken'],
  ) => void
}

export const useTunnelState = function (): TunnelState & TunnelFunctionEvents {
  const bitcoin = useBitcoin()
  const hemi = useHemi()
  const { evmRemoteNetworks, networks } = useNetworks()
  const tunnelOperation = useTunnelOperation()
  const tokenList = useTunnelTokens()

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
    providerType: 'native',
    toToken: getNativeToken(initial.toNetworkId),
    ...initial,
  } as TunnelState)

  const toggleTunnelProviderType = useCallback(
    function (payload: TunnelProviderType) {
      dispatch({ payload, type: 'toggleTunnelProviderType' })
    },
    [dispatch],
  )

  // This function cleans up the user input, only allowing strings representing
  // numbers to go through and alter the state.
  const updateFromInput = useCallback(
    function (payload: UpdateFromInput['payload']) {
      const result = sanitizeAmount(payload)
      if (!('error' in result)) {
        dispatch({ payload: result.value, type: 'updateFromInput' })
      }
    },
    [dispatch],
  )

  const { operation } = tunnelOperation

  const networkToggled =
    hemi.testnet !== (findChainById(state.fromNetworkId)?.testnet ?? false)

  const initialFromNetworkId = initial.fromNetworkId
  const initialToNetworkId = initial.toNetworkId

  // We need to use useLayoutEffect here because by using a regular useEffect
  // there are intermediate invalid states that gets rendered. This is because
  // this effect fires when the user switched the network (mainnet <=> testnet)
  // so this state must update as token addresses needs to be updated
  useLayoutEffect(
    function updateStateOnNetworkSwitch() {
      if (networkToggled) {
        dispatch({
          payload: {
            fromNetworkId: initialFromNetworkId,
            toNetworkId: initialToNetworkId,
          },
          type: 'toggleTestnetMainnet',
        })
      }
    },
    [dispatch, initialFromNetworkId, initialToNetworkId, networkToggled],
  )

  const getTunnelToken = useCallback(
    function (fromToken: Token, toNetworkId: RemoteChain['id']) {
      const bridgeAddress =
        fromToken.extensions?.bridgeInfo?.[toNetworkId]?.tokenAddress
      // find the tunneled pair of the token, or go with the native if missing
      // bitcoin is a special case as it tunnels a native token (btc) into an erc20
      if (fromToken.chainId === bitcoin.id) {
        const bitcoinNativeToken = getNativeToken(fromToken.chainId)
        return tokenList.find(
          t =>
            t.chainId === toNetworkId &&
            t.address ===
              bitcoinNativeToken.extensions?.bridgeInfo?.[toNetworkId]
                ?.tokenAddress,
        )!
      }

      const toToken =
        isNativeToken(fromToken) || bitcoin.id === toNetworkId
          ? getNativeToken(toNetworkId)
          : tokenList.find(
              t => t.address === bridgeAddress && t.chainId === toNetworkId,
            )
      return toToken!
    },
    [bitcoin.id, tokenList],
  )

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
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
    toggleTunnelProviderType,
    updateFromInput,
    updateFromNetwork: useCallback(
      function (fromNetworkId: UpdateFromNetwork['payload']) {
        // update network
        dispatch({ payload: fromNetworkId, type: 'updateFromNetwork' })
        // given the upload, we may need to update the tokens
        const fromToken = getNativeToken(fromNetworkId)
        // the "current" fromNetwork is going to be the next toNetwork.
        const toToken = getTunnelToken(fromToken, state.toNetworkId)
        dispatch({ payload: { fromToken, toToken }, type: 'updateFromToken' })
      },
      [dispatch, getTunnelToken, state.toNetworkId],
    ),
    updateFromToken: useCallback(
      function (fromToken, toToken) {
        // if token is defined use that one. This is needed for the scenarios where
        // the token is not saved yet in the custom list
        if (toToken) {
          dispatch({ payload: { fromToken, toToken }, type: 'updateFromToken' })
          return
        }

        // if the selected token can't be tunneled to the target chain
        // we need to first update the target network
        // just grab the first available network that's enabled
        if (!fromToken.extensions?.bridgeInfo?.[state.toNetworkId]) {
          const [newToNetworkId] = Object.keys(
            fromToken.extensions!.bridgeInfo!,
          ).filter(id => networks.some(n => n.id.toString() === id))
          // parse as int or keep as string, depending on the id
          const payload = (
            isNaN(parseInt(newToNetworkId))
              ? newToNetworkId
              : parseInt(newToNetworkId)
          ) as TunnelState['toNetworkId']
          dispatch({
            payload,
            type: 'updateToNetwork',
          })

          dispatch({
            payload: { fromToken, toToken: getTunnelToken(fromToken, payload) },
            type: 'updateFromToken',
          })
          return
        }

        dispatch({
          payload: {
            fromToken,
            toToken: getTunnelToken(fromToken, state.toNetworkId),
          },
          type: 'updateFromToken',
        })
      },
      [dispatch, getTunnelToken, networks, state.toNetworkId],
    ),
    updateToNetwork: useCallback(
      function (toNetworkId: UpdateToNetwork['payload']) {
        // update network
        dispatch({ payload: toNetworkId, type: 'updateToNetwork' })
        // if we're updating the "To", it means Hemi is on the "From" network
        // so the "From" must be updated to the tunnel equivalent in Hemi.
        const tunneledEthHemi = getNativeToken(hemi.id)
        const nativeToken = getNativeToken(toNetworkId)
        const targetAddress =
          nativeToken.extensions?.bridgeInfo?.[hemi.id]?.tokenAddress
        const fromToken = targetAddress
          ? getTokenByAddress(targetAddress, hemi.id) ?? tunneledEthHemi
          : tunneledEthHemi

        const toToken = getTunnelToken(fromToken, toNetworkId)

        dispatch({ payload: { fromToken, toToken }, type: 'updateFromToken' })
      },
      [dispatch, getTunnelToken, hemi.id],
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
