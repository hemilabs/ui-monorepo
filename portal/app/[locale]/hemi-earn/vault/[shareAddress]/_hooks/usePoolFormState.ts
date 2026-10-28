import { useCallback, useReducer } from 'react'
import { sanitizeAmount } from 'utils/form'
import { type NoPayload, type Payload } from 'utils/typeUtilities'

import {
  type DepositOperation,
  type WithdrawOperation,
} from '../_types/operations'

type WithdrawMode = 'shares' | 'tokens'

type PoolFormState = {
  approveExtraAmount: boolean
  depositOperation?: DepositOperation
  input: string
  // undefined means "Auto" — the effective value is the active tab's default.
  slippage?: number
  withdrawMode: WithdrawMode
  withdrawOperation?: WithdrawOperation
}

type Action<T extends string> = {
  type: T
}

type ResetSettings = Action<'resetSettings'> & NoPayload
type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateApproveExtraAmount = Action<'updateApproveExtraAmount'> &
  Payload<boolean>
type UpdateDepositOperation = Action<'updateDepositOperation'> &
  Payload<DepositOperation | undefined>
type UpdateInput = Action<'updateInput'> &
  Payload<{ value: string; withdrawMode?: WithdrawMode }>
type UpdateSlippage = Action<'updateSlippage'> & Payload<number | undefined>
type UpdateWithdrawOperation = Action<'updateWithdrawOperation'> &
  Payload<WithdrawOperation | undefined>

type Actions =
  | ResetSettings
  | ResetStateAfterOperation
  | UpdateApproveExtraAmount
  | UpdateDepositOperation
  | UpdateInput
  | UpdateSlippage
  | UpdateWithdrawOperation

type ActionHandlers = {
  [K in Actions['type']]: (
    state: PoolFormState,
    payload: Extract<Actions, { type: K }>['payload'],
  ) => PoolFormState
}

const settingsDefaults = {
  approveExtraAmount: false,
  slippage: undefined,
}

const actionHandlers: ActionHandlers = {
  resetSettings: state => ({ ...state, ...settingsDefaults }),

  resetStateAfterOperation: state => ({
    ...state,
    ...settingsDefaults,
    input: '0',
    withdrawMode: 'shares',
  }),

  updateApproveExtraAmount: (state, payload) => ({
    ...state,
    approveExtraAmount: payload,
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

  updateSlippage: (state, payload) => ({ ...state, slippage: payload }),

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
    ...settingsDefaults,
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
    resetSettings: useCallback(() => dispatch({ type: 'resetSettings' }), []),
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [],
    ),
    updateApproveExtraAmount: useCallback(
      (payload: boolean) =>
        dispatch({ payload, type: 'updateApproveExtraAmount' }),
      [],
    ),
    updateAssetInput,
    updateDepositOperation,
    updateInput,
    updateSharesInput,
    updateSlippage: useCallback(
      (payload: number | undefined) =>
        dispatch({ payload, type: 'updateSlippage' }),
      [],
    ),
    updateWithdrawOperation,
  }
}
