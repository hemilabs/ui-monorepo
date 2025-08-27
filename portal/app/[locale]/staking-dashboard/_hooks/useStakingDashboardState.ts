import { useCallback, useReducer } from 'react'
import {
  StakingDashboardOperation,
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

type Actions =
  | ResetStateAfterOperation
  | UpdateInput
  | UpdateInputDays
  | UpdateLockupDays
  | UpdateStakingDashboardOperation

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

    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

type StakingDashboardFunctionEvents = {
  [K in Actions['type']]: (
    payload?: Extract<Actions, { type: K }>['payload'],
  ) => void
}

export const useStakingDashboardState = function (): StakingDashboardState &
  StakingDashboardFunctionEvents {
  const [state, dispatch] = useReducer(reducer, {
    input: '0',
    inputDays: twoYears.toString(),
    lockupDays: twoYears,
  } as StakingDashboardState)

  const updateInput = useCallback(function (payload: UpdateInput['payload']) {
    const { error, value } = sanitizeAmount(payload)
    if (!error) {
      dispatch({ payload: value, type: 'updateInput' })
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
  }
}

export type StakingDashboardStake = {
  token: StakingDashboardToken
}

export type TypedStakingDashboardState<T extends StakingDashboardStake> =
  ReturnType<typeof useStakingDashboardState> & T
