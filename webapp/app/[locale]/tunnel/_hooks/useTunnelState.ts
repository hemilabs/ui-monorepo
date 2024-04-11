import { bridgeableNetworks, hemi } from 'app/networks'
import { useCallback, useReducer } from 'react'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import type { Address, Chain, Hash } from 'viem'

export type Operation = 'claim' | 'deposit' | 'prove' | 'withdraw'

const getNativeToken = (chain: Chain['id']) =>
  tokenList.tokens.find(t => t.chainId === chain && isNativeToken(t))

type ProveWithdrawalData = {
  withdrawAmount: string
  withdrawL1NetworkId: Chain['id']
  withdrawSymbol: string
  withdrawTxHash: Hash
}

type TunnelState = {
  extendedErc20Approval: boolean
  fromNetworkId: Chain['id']
  fromInput: string
  fromToken: Token
  operation: Operation
  toNetworkId: Chain['id']
  toToken: Token
} & (
  | { operation: 'deposit' | 'withdraw' }
  | (ProveWithdrawalData &
      (
        | { operation: 'prove' }
        | ({ operation: 'claim' } & { proveWithdrawalTxHash: Hash })
      ))
)

type Action<T extends string> = {
  type: T
}

type NoPayload = { payload?: never }

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload

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
type UpdateToToken = Action<'updateToToken'> & {
  payload: Token
}
type WaitForClaimAvailable = Action<'waitForClaimAvailable'> & {
  payload: Hash
}
type WaitForWithdrawalPublished = Action<'waitForWithdrawalPublished'> & {
  payload: {
    withdrawAmount: string
    withdrawL1NetworkId: Chain['id']
    withdrawSymbol: string
    withdrawTxHash: Address
  }
}

type ToggleInputs = Action<'toggleInput'> & NoPayload
type Actions =
  | ResetStateAfterOperation
  | UpdateExtendedErc20Approval
  | UpdateFromNetwork
  | UpdateFromInput
  | UpdateFromToken
  | UpdateToNetwork
  | UpdateToToken
  | ToggleInputs
  | WaitForClaimAvailable
  | WaitForWithdrawalPublished

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
    case 'updateToToken': {
      const { payload: toToken } = action
      return {
        ...state,
        toToken,
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
      if (newState.operation === 'claim' || newState.operation === 'prove') {
        // clean extra fields that are not part of deposit
        delete newState.withdrawL1NetworkId
        delete newState.withdrawAmount
        delete newState.withdrawSymbol
        delete newState.withdrawTxHash
      }
      if (newState.operation === 'claim') {
        delete newState.proveWithdrawalTxHash
      }
      newState.operation =
        newState.operation === 'deposit' ? 'withdraw' : 'deposit'
      return newState
    }
    case 'waitForClaimAvailable': {
      const proveWithdrawalTxHash = action.payload
      // @ts-expect-error due actions defined, properties that TS think may be missing
      // are already defined
      return {
        ...state,
        operation: 'claim',
        proveWithdrawalTxHash,
      }
    }
    case 'waitForWithdrawalPublished': {
      const {
        withdrawAmount,
        withdrawL1NetworkId,
        withdrawSymbol,
        withdrawTxHash,
      } = action.payload
      return {
        ...state,
        operation: 'prove',
        withdrawAmount,
        withdrawL1NetworkId,
        withdrawSymbol,
        withdrawTxHash,
      }
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
  const [state, dispatch] = useReducer(reducer, {
    extendedErc20Approval: false,
    fromInput: '0',
    fromNetworkId: bridgeableNetworks[0].id,
    fromToken: getNativeToken(bridgeableNetworks[0].id),
    operation: 'deposit',
    toNetworkId: hemi.id,
    toToken: getNativeToken(hemi.id),
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
    toggleInput: useCallback(
      () => dispatch({ type: 'toggleInput' }),
      [dispatch],
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
    updateToToken: useCallback(
      (payload: UpdateToToken['payload']) =>
        dispatch({ payload, type: 'updateToToken' }),
      [dispatch],
    ),
    waitForClaimAvailable: useCallback(
      (payload: WaitForClaimAvailable['payload']) =>
        dispatch({ payload, type: 'waitForClaimAvailable' }),
      [dispatch],
    ),
    waitForWithdrawalPublished: useCallback(
      (payload: WaitForWithdrawalPublished['payload']) =>
        dispatch({ payload, type: 'waitForWithdrawalPublished' }),
      [dispatch],
    ),
  }
}
