import {
  evmRemoteNetworks,
  hemi,
  networks,
  type RemoteChain,
} from 'app/networks'
import { type BtcChain } from 'btc-wallet/chains'
import { useCallback, useReducer } from 'react'
import { tokenList } from 'tokenList'
import { type BtcToken, type EvmToken, type Token } from 'types/token'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { isNativeToken, getTokenByAddress } from 'utils/token'
import { type Chain, type Hash } from 'viem'

import { useTunnelOperation } from './useTunnelOperation'

export type Operation = 'claim' | 'deposit' | 'prove' | 'withdraw' | 'view'

const getNativeToken = (chain: RemoteChain['id']) =>
  tokenList.tokens.find(t => t.chainId === chain && isNativeToken(t))

export type TunnelState = {
  fromInput: string
  fromNetworkId: RemoteChain['id']
  fromToken: Token
  partialWithdrawal?: Partial<{
    withdrawalTxHash: Hash
    claimWithdrawalTxHash: Hash
    proveWithdrawalTxHash: Hash
  }>
  toNetworkId: RemoteChain['id']
  toToken: Token
}

type Action<T extends string> = {
  type: T
}

type NoPayload = { payload?: never }

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload

type SavePartialWithdrawal = Action<'savePartialWithdrawal'> & {
  payload: TunnelState['partialWithdrawal']
}
type UpdateFromNetwork = Action<'updateFromNetwork'> & {
  payload: TunnelState['fromNetworkId']
}
type UpdateFromToken = Action<'updateFromToken'> & {
  payload: TunnelState['fromToken']
}
type UpdateFromInput = Action<'updateFromInput'> & {
  payload: string
}
type UpdateToNetwork = Action<'updateToNetwork'> & {
  payload: TunnelState['toNetworkId']
}

type ToggleInput = Action<'toggleInput'> & NoPayload
type Actions =
  | ResetStateAfterOperation
  | SavePartialWithdrawal
  | UpdateFromNetwork
  | UpdateFromInput
  | UpdateFromToken
  | UpdateToNetwork
  | ToggleInput

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
      delete newState.partialWithdrawal
      return newState
    }
    case 'savePartialWithdrawal': {
      return {
        ...state,
        partialWithdrawal: {
          ...(state.partialWithdrawal || {}),
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
      const toToken = bridgeAddress
        ? getTokenByAddress(bridgeAddress, toNetworkId) ??
          getNativeToken(toNetworkId)
        : getNativeToken(toNetworkId)

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
      delete newState.partialWithdrawal

      return newState
    }
    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

export const useTunnelState = function (): TunnelState & {
  // will throw compile error if a proper function event is missing!
  [K in Actions['type']]: (
    payload?: Extract<Actions, { type: K }>['payload'],
  ) => void
} {
  const { setQueryParams, removeQueryParams } = useQueryParams()
  const { operation } = useTunnelOperation()

  const initial =
    !operation || operation === 'deposit'
      ? {
          fromNetworkId: evmRemoteNetworks[0].id,
          toNetworkId: hemi.id,
        }
      : {
          fromNetworkId: hemi.id,
          toNetworkId: evmRemoteNetworks[0].id,
        }

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

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [dispatch],
    ),
    savePartialWithdrawal: useCallback(
      (payload: SavePartialWithdrawal['payload']) =>
        dispatch({
          payload,
          type: 'savePartialWithdrawal',
        }),
      [dispatch],
    ),
    toggleInput: useCallback(
      function () {
        const newOperation = operation === 'deposit' ? 'withdraw' : 'deposit'
        removeQueryParams('txHash', 'replace')
        setQueryParams({ operation: newOperation })
        dispatch({ type: 'toggleInput' })
      },
      [dispatch, operation, removeQueryParams, setQueryParams],
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
      [dispatch, state],
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
      [dispatch],
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
