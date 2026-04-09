import { useCallback, useReducer } from 'react'
import { sanitizeAmount } from 'utils/form'
import { type NoPayload, type Payload } from 'utils/typeUtilities'

import {
  type VaultDepositOperation,
  type VaultWithdrawOperation,
} from '../_types/vaultOperations'

type VaultFormState = {
  depositOperation?: VaultDepositOperation
  input: string
  withdrawOperation?: VaultWithdrawOperation
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateDepositOperation = Action<'updateDepositOperation'> &
  Payload<VaultDepositOperation | undefined>
type UpdateInput = Action<'updateInput'> & Payload<string>
type UpdateWithdrawOperation = Action<'updateWithdrawOperation'> &
  Payload<VaultWithdrawOperation | undefined>

type Actions =
  | ResetStateAfterOperation
  | UpdateDepositOperation
  | UpdateInput
  | UpdateWithdrawOperation

type ActionHandlers = {
  [K in Actions['type']]: (
    state: VaultFormState,
    payload: Extract<Actions, { type: K }>['payload'],
  ) => VaultFormState
}

const actionHandlers: ActionHandlers = {
  resetStateAfterOperation: state => ({
    ...state,
    input: '0',
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
    input: payload,
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

function reducer(state: VaultFormState, action: Actions) {
  const handler = actionHandlers[action.type]

  return (
    handler as (
      state: VaultFormState,
      payload: typeof action.payload,
    ) => VaultFormState
  )(state, action.payload)
}

export const useVaultFormState = function () {
  const [state, dispatch] = useReducer(reducer, {
    input: '0',
  })

  const updateDepositOperation = useCallback(function (
    payload: UpdateDepositOperation['payload'],
  ) {
    dispatch({ payload, type: 'updateDepositOperation' })
  }, [])

  const updateInput = useCallback(function (payload: UpdateInput['payload']) {
    const result = sanitizeAmount(payload)
    if (!('error' in result)) {
      dispatch({ payload: result.value, type: 'updateInput' })
    }
  }, [])

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
    updateDepositOperation,
    updateInput,
    updateWithdrawOperation,
  }
}
