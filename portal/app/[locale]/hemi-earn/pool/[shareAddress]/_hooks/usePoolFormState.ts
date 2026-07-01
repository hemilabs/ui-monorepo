import { useCallback, useReducer } from 'react'
import { sanitizeAmount } from 'utils/form'
import { type NoPayload, type Payload } from 'utils/typeUtilities'

import {
  type DepositOperation,
  type WithdrawOperation,
} from '../_types/operations'

type WithdrawMode = 'shares' | 'tokens'

type PoolFormState = {
  depositOperation?: DepositOperation
  input: string
  withdrawMode: WithdrawMode
  withdrawOperation?: WithdrawOperation
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateDepositOperation = Action<'updateDepositOperation'> &
  Payload<DepositOperation | undefined>
type UpdateInput = Action<'updateInput'> &
  Payload<{ value: string; withdrawMode?: WithdrawMode }>
type UpdateWithdrawOperation = Action<'updateWithdrawOperation'> &
  Payload<WithdrawOperation | undefined>

type Actions =
  | ResetStateAfterOperation
  | UpdateDepositOperation
  | UpdateInput
  | UpdateWithdrawOperation

type ActionHandlers = {
  [K in Actions['type']]: (
    state: PoolFormState,
    payload: Extract<Actions, { type: K }>['payload'],
  ) => PoolFormState
}

const actionHandlers: ActionHandlers = {
  resetStateAfterOperation: state => ({
    ...state,
    input: '0',
    withdrawMode: 'shares',
  }),

  updateDepositOperation: (state, payload) => ({
    ...state,
    depositOperation: payload
      ? {
          ...state.depositOperation,
          ...payload,
        }
      : undefined,
  }),

  updateInput: (state, payload) => ({
    ...state,
    input: payload.value,
    withdrawMode: payload.withdrawMode ?? state.withdrawMode,
  }),

  updateWithdrawOperation: (state, payload) => ({
    ...state,
    withdrawOperation: payload
      ? {
          ...state.withdrawOperation,
          ...payload,
        }
      : undefined,
  }),
}

function reducer(state: PoolFormState, action: Actions) {
  const handler = actionHandlers[action.type]

  return (
    handler as (
      state: PoolFormState,
      payload: typeof action.payload,
    ) => PoolFormState
  )(state, action.payload)
}

export const usePoolFormState = function () {
  const [state, dispatch] = useReducer(reducer, {
    input: '0',
    withdrawMode: 'shares',
  })

  const updateDepositOperation = useCallback(function (
    payload: UpdateDepositOperation['payload'],
  ) {
    dispatch({ payload, type: 'updateDepositOperation' })
  }, [])

  const dispatchInput = useCallback(function (
    value: string,
    withdrawMode?: WithdrawMode,
  ) {
    const result = sanitizeAmount(value)
    if (!('error' in result)) {
      dispatch({
        payload: { value: result.value, withdrawMode },
        type: 'updateInput',
      })
    }
  }, [])

  const updateInput = useCallback(
    (value: string) => dispatchInput(value),
    [dispatchInput],
  )
  const updateSharesInput = useCallback(
    (value: string) => dispatchInput(value, 'shares'),
    [dispatchInput],
  )
  const updateAssetInput = useCallback(
    (value: string) => dispatchInput(value, 'tokens'),
    [dispatchInput],
  )

  const updateWithdrawOperation = useCallback(function (
    payload: UpdateWithdrawOperation['payload'],
  ) {
    dispatch({ payload, type: 'updateWithdrawOperation' })
  }, [])

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [],
    ),
    updateAssetInput,
    updateDepositOperation,
    updateInput,
    updateSharesInput,
    updateWithdrawOperation,
  }
}
