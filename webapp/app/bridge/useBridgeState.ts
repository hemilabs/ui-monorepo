import { bvm, bridgableNetworks } from 'app/networks'
import { useReducer } from 'react'
import { tokenList } from 'tokenList'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'
import { Chain } from 'viem'

const getNativeToken = (chain: Chain['id']) =>
  tokenList.tokens.find(t => t.chainId === chain && isNativeToken(t))

type BridgeState = {
  fromNetworkId: Chain['id']
  fromInput: string
  fromToken: Token
  toNetworkId: Chain['id']
  toToken: Token
}

type Action<T extends string> = {
  type: T
}

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
type Toggle = Action<'toggle'> & { payload?: never }
type Actions =
  | UpdateFromNetwork
  | UpdateFromInput
  | UpdateFromToken
  | UpdateToNetwork
  | UpdateToToken
  | Toggle

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compilationError = function (_: never): never {
  throw new Error('Missing implementation of action in reducer')
}

const reducer = function (state: BridgeState, action: Actions) {
  const { type } = action
  switch (type) {
    case 'updateFromNetwork': {
      const { payload: fromNetworkId } = action
      return {
        ...state,
        fromNetworkId,
        fromToken: getNativeToken(fromNetworkId),
      }
    }
    case 'updateFromToken': {
      const { payload: fromToken } = action
      return {
        ...state,
        fromToken,
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
    case 'toggle': {
      return {
        ...state,
        fromNetworkId: state.toNetworkId,
        fromToken: state.toToken,
        toNetworkId: state.fromNetworkId,
        toToken: state.fromToken,
      }
    }
    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

export const useBridgeState = function (): BridgeState & {
  // will throw compile error if a proper function event is missing!
  [K in Actions['type']]: (
    payload?: Extract<Actions, { type: K }>['payload'],
  ) => void
} {
  const [state, dispatch] = useReducer(reducer, {
    fromInput: '0',
    fromNetworkId: bridgableNetworks[0].id,
    fromToken: getNativeToken(bridgableNetworks[0].id),
    toNetworkId: bvm.id,
    toToken: getNativeToken(bvm.id),
  })

  const updateFromInput = function (payload: UpdateFromInput['payload']) {
    // verify if input is a valid number
    const validationRegex = /^\d*\.?\d*$/
    if (!validationRegex.test(payload)) {
      return
    }
    dispatch({
      payload: payload.replace(/^0+/, ''),
      type: 'updateFromInput',
    })
  }

  return {
    ...state,
    toggle: () => dispatch({ type: 'toggle' }),
    updateFromInput,
    updateFromNetwork: (payload: UpdateFromNetwork['payload']) =>
      dispatch({ payload, type: 'updateFromNetwork' }),
    updateFromToken: (payload: UpdateFromToken['payload']) =>
      dispatch({ payload, type: 'updateFromToken' }),
    updateToNetwork: (payload: UpdateToNetwork['payload']) =>
      dispatch({ payload, type: 'updateToNetwork' }),
    updateToToken: (payload: UpdateToToken['payload']) =>
      dispatch({ payload, type: 'updateToToken' }),
  }
}
