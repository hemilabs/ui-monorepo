import { useCallback, useReducer } from 'react'
import {
  type StakingDashboardOperation,
  type UnlockingDashboardOperation,
  type StakingDashboardToken,
} from 'types/stakingDashboard'
import { sanitizeAmount } from 'utils/form'
import { type NoPayload, type Payload } from 'utils/typeUtilities'

import { twoYears } from '../_utils/lockCreationTimes'

type StakingDashboardState = {
  input: string
  inputDays: string
  lockupDays: number
  stakingDashboardOperation?: StakingDashboardOperation
  unlockingDashboardOperation?: UnlockingDashboardOperation
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateInput = Action<'updateInput'> & Payload<string>
type UpdateInputDays = Action<'updateInputDays'> & Payload<string>
type UpdateLockupDays = Action<'updateLockupDays'> & Payload<number>
type UpdateStakingDashboardOperation =
  Action<'updateStakingDashboardOperation'> &
    Payload<StakingDashboardOperation | undefined>
type UpdateUnlockingDashboardOperation =
  Action<'updateUnlockingDashboardOperation'> &
    Payload<UnlockingDashboardOperation | undefined>

type Actions =
  | ResetStateAfterOperation
  | UpdateInput
  | UpdateInputDays
  | UpdateLockupDays
  | UpdateStakingDashboardOperation
  | UpdateUnlockingDashboardOperation

const compilationError = function (value: string): never {
  throw new Error(`Missing implementation of action in reducer: ${value}`)
}

type ActionHandlers = {
  [K in Actions['type']]: (
    state: StakingDashboardState,
    payload: Extract<Actions, { type: K }>['payload'],
  ) => StakingDashboardState
}

const actionHandlers: ActionHandlers = {
  resetStateAfterOperation: state => ({
    ...state,
    input: '0',
    inputDays: twoYears.toString(),
    lockupDays: twoYears,
  }),

  updateInput: (state, payload) => ({
    ...state,
    input: payload,
  }),

  updateInputDays: (state, payload) => ({
    ...state,
    inputDays: payload,
  }),

  updateLockupDays: (state, payload) => ({
    ...state,
    lockupDays: payload,
  }),

  updateStakingDashboardOperation: (state, payload) => ({
    ...state,
    stakingDashboardOperation: {
      ...(state.stakingDashboardOperation ?? {}),
      ...payload,
    },
  }),

  updateUnlockingDashboardOperation: (state, payload) => ({
    ...state,
    unlockingDashboardOperation: {
      ...(state.unlockingDashboardOperation ?? {}),
      ...payload,
    },
  }),
}

function reducer(
  state: StakingDashboardState,
  action: Actions,
): StakingDashboardState {
  const handler = actionHandlers[action.type]

  if (!handler) {
    return compilationError(action.type)
  }

  // Typescript can't infer that handler automatically
  return (
    handler as (
      state: StakingDashboardState,
      payload: typeof action.payload,
    ) => StakingDashboardState
  )(state, action.payload)
}

type StakingDashboardFunctionEvents = {
  [K in Actions['type']]: Extract<Actions, { type: K }> extends NoPayload
    ? () => void
    : (payload: Extract<Actions, { type: K }>['payload']) => void
}

export const useStakingDashboardState = function (): StakingDashboardState &
  StakingDashboardFunctionEvents {
  const [state, dispatch] = useReducer(reducer, {
    input: '0',
    inputDays: twoYears.toString(),
    lockupDays: twoYears,
  } as StakingDashboardState)

  const updateInput = useCallback(function (payload: UpdateInput['payload']) {
    const result = sanitizeAmount(payload)
    if (!('error' in result)) {
      dispatch({ payload: result.value, type: 'updateInput' })
    }
  }, [])

  const updateInputDays = useCallback(function (
    payload: UpdateInputDays['payload'],
  ) {
    dispatch({ payload, type: 'updateInputDays' })
  }, [])

  const updateLockupDays = useCallback(function (
    payload: UpdateLockupDays['payload'],
  ) {
    dispatch({ payload, type: 'updateLockupDays' })
  }, [])

  const updateStakingDashboardOperation = useCallback(function (
    payload: UpdateStakingDashboardOperation['payload'],
  ) {
    let sanitizedPayload = payload

    if (payload?.input !== undefined) {
      const result = sanitizeAmount(payload.input)
      if ('error' in result) {
        return
      }
      sanitizedPayload = { ...payload, input: result.value }
    }

    dispatch({
      payload: sanitizedPayload,
      type: 'updateStakingDashboardOperation',
    })
  }, [])

  const updateUnlockingDashboardOperation = useCallback(function (
    payload: UpdateUnlockingDashboardOperation['payload'],
  ) {
    dispatch({ payload, type: 'updateUnlockingDashboardOperation' })
  }, [])

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [],
    ),
    updateInput,
    updateInputDays,
    updateLockupDays,
    updateStakingDashboardOperation,
    updateUnlockingDashboardOperation,
  }
}

export type StakingDashboardStake = {
  token: StakingDashboardToken
}

export type TypedStakingDashboardState<T extends StakingDashboardStake> =
  ReturnType<typeof useStakingDashboardState> & T
