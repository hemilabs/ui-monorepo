import { TokenBridgeMessage } from '@eth-optimism/sdk'
import { bridgeableNetworks, hemi } from 'app/networks'
import { useCallback, useEffect, useReducer } from 'react'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { useQueryParams } from 'ui-common/hooks/useQueryParams'
import { isNativeToken } from 'utils/token'
import { Address, Chain, Hash, isHash } from 'viem'

export type Operation = 'claim' | 'deposit' | 'prove' | 'withdraw'

const getNativeToken = (chain: Chain['id']) =>
  tokenList.tokens.find(t => t.chainId === chain && isNativeToken(t))

const validOperations: Operation[] = ['claim', 'deposit', 'prove', 'withdraw']

function isValidOperation(value: string): value is Operation {
  return validOperations.includes(value as Operation)
}

export const useTunnelOperation = function (): {
  operation: Operation
  txHash: Address | undefined
} {
  const { queryParams, removeQueryParams, setQueryParams } = useQueryParams()
  const { operation, txHash } = queryParams

  const isValid = isValidOperation(operation)
  const isValidTxHash = isHash(txHash)

  useEffect(
    function updateDefaultParameters() {
      if (!isValid) {
        setQueryParams({ operation: 'deposit' })
      }
      if (!isValidTxHash && txHash) {
        removeQueryParams('txHash')
      }
    },
    [
      isValid,
      isValidTxHash,
      queryParams,
      removeQueryParams,
      setQueryParams,
      txHash,
    ],
  )

  return {
    operation: isValid ? operation : 'deposit',
    txHash: isValidTxHash ? txHash : undefined,
  }
}
type TunnelState = {
  extendedErc20Approval: boolean
  fromNetworkId: Chain['id']
  fromInput: string
  fromToken: Token
  toNetworkId: Chain['id']
  toToken: Token
  partialWithdrawal?: Partial<
    TokenBridgeMessage & {
      proveWithdrawalTxHash: Hash
    }
  >
}

type Action<T extends string> = {
  type: T
}

type NoPayload = { payload?: never }

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload

type SavePartialWithdrawal = Action<'savePartialWithdrawal'> & {
  payload: TunnelState['partialWithdrawal']
}

type UpdateExtendedErc20Approval = Action<'updateExtendedErc20Approval'> &
  NoPayload

type UpdateFromNetwork = Action<'updateFromNetwork'> & {
  payload: Chain['id']
}
type UpdateFromToken = Action<'updateFromToken'> & {
  payload: Token
}
type UpdateFromInput = Action<'updateFromInput'> & {
  payload: string
}
type UpdateToNetwork = Action<'updateToNetwork'> & {
  payload: Chain['id']
}

type ToggleInput = Action<'toggleInput'> & NoPayload
type Actions =
  | ResetStateAfterOperation
  | SavePartialWithdrawal
  | UpdateExtendedErc20Approval
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
      return {
        ...state,
        extendedErc20Approval: false,
        fromInput: '0',
      }
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
    case 'updateExtendedErc20Approval': {
      return {
        ...state,
        extendedErc20Approval: !state.extendedErc20Approval,
      }
    }
    case 'updateFromNetwork': {
      const { payload: fromNetworkId } = action
      return {
        ...state,
        extendedErc20Approval: false,
        fromNetworkId,
        fromToken: getNativeToken(fromNetworkId),
      }
    }
    case 'updateFromToken': {
      const { payload: fromToken } = action
      const { toNetworkId } = state
      const nativeToken = isNativeToken(fromToken)
      let toToken
      if (nativeToken) {
        toToken = getNativeToken(toNetworkId)
      } else {
        const bridgeAddress =
          fromToken.extensions.bridgeInfo[toNetworkId].tokenAddress
        // find the tunneled pair of the token
        toToken = tokenList.tokens.find(
          t => t.chainId === toNetworkId && t.address === bridgeAddress,
        )
      }
      return {
        ...state,
        extendedErc20Approval: nativeToken
          ? false
          : state.extendedErc20Approval,
        fromToken,
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
        extendedErc20Approval: isNativeToken(newFromToken)
          ? false
          : state.extendedErc20Approval,
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
    operation === 'deposit'
      ? {
          fromNetworkId: bridgeableNetworks[0].id,
          toNetworkId: hemi.id,
        }
      : {
          fromNetworkId: hemi.id,
          toNetworkId: bridgeableNetworks[0].id,
        }

  const [state, dispatch] = useReducer(reducer, {
    extendedErc20Approval: false,
    fromInput: '0',
    fromToken: getNativeToken(initial.fromNetworkId),
    toToken: getNativeToken(initial.toNetworkId),
    ...initial,
  })

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
        removeQueryParams('txHash')
        setQueryParams({ operation: newOperation })
        dispatch({ type: 'toggleInput' })
      },
      [dispatch, operation, removeQueryParams, setQueryParams],
    ),
    updateExtendedErc20Approval: useCallback(
      () => dispatch({ type: 'updateExtendedErc20Approval' }),
      [dispatch],
    ),
    updateFromInput,
    updateFromNetwork: useCallback(
      (payload: UpdateFromNetwork['payload']) =>
        dispatch({ payload, type: 'updateFromNetwork' }),
      [dispatch],
    ),
    updateFromToken: useCallback(
      (payload: UpdateFromToken['payload']) =>
        dispatch({ payload, type: 'updateFromToken' }),
      [dispatch],
    ),
    updateToNetwork: useCallback(
      (payload: UpdateToNetwork['payload']) =>
        dispatch({ payload, type: 'updateToNetwork' }),
      [dispatch],
    ),
  }
}
