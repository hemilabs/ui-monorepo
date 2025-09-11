import { useCallback, useReducer } from 'react'
import {
  StakingDashboardOperation,
  UnlockingDashboardOperation,
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
type UpdateLockupDays = Action<'updateLockupDays'> & Payload<number>
type UpdateInput = Action<'updateInput'> & Payload<string>
type UpdateInputDays = Action<'updateInputDays'> & Payload<string>
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

// the _:never is used to fail compilation if a case is missing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const compilationError = function (_: never): never {
  throw new Error('Missing implementation of action in reducer')
}

function reducer(
  state: StakingDashboardState,
  action: Actions,
): StakingDashboardState {
  const { payload, type } = action

  switch (type) {
    case 'resetStateAfterOperation':
      return {
        ...state,
        input: '0',
        inputDays: twoYears.toString(),
        lockupDays: twoYears,
      }

    case 'updateInput':
      return { ...state, input: payload }

    case 'updateInputDays':
      return { ...state, inputDays: payload }

    case 'updateLockupDays':
      return { ...state, lockupDays: payload }

    case 'updateStakingDashboardOperation':
      return {
        ...state,
        stakingDashboardOperation: {
          ...(state.stakingDashboardOperation ?? {}),
          ...payload,
        },
      }

    case 'updateUnlockingDashboardOperation':
      return {
        ...state,
        unlockingDashboardOperation: {
          ...(state.unlockingDashboardOperation ?? {}),
          ...payload,
        },
      }

    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
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
    dispatch({ payload, type: 'updateStakingDashboardOperation' })
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
