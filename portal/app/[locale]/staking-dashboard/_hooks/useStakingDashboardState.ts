import { useCallback, useReducer } from 'react'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { sanitizeAmount } from 'utils/form'
import { type NoPayload, type Payload } from 'utils/typeUtilities'

type StakingDashboardState = {
  estimatedApy: number
  input: string
  lockupDays: number
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateEstimatedApy = Action<'updateEstimatedApy'> & Payload<number>
type UpdateLockupDays = Action<'updateLockupDays'> & Payload<number>
type UpdateInput = Action<'updateInput'> & Payload<string>

type Actions =
  | ResetStateAfterOperation
  | UpdateEstimatedApy
  | UpdateInput
  | UpdateLockupDays

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
      return { ...state, input: '0' }

    case 'updateEstimatedApy':
      return { ...state, estimatedApy: payload }

    case 'updateInput':
      return { ...state, input: payload }

    case 'updateLockupDays':
      return { ...state, lockupDays: payload }

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
    estimatedApy: 9.6, // TODO - Placeholder for estimated APY, replace with actual logic
    input: '0',
    lockupDays: 732, // Default to 2 years
  } as StakingDashboardState)

  const updateEstimatedApy = useCallback(function (
    payload: UpdateEstimatedApy['payload'],
  ) {
    dispatch({ payload, type: 'updateEstimatedApy' })
  }, [])

  const updateInput = useCallback(function (payload: UpdateInput['payload']) {
    const { error, value } = sanitizeAmount(payload)
    if (!error) {
      dispatch({ payload: value, type: 'updateInput' })
    }
  }, [])

  const updateLockupDays = useCallback(function (
    payload: UpdateLockupDays['payload'],
  ) {
    dispatch({ payload, type: 'updateLockupDays' })
  }, [])

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [],
    ),
    updateEstimatedApy,
    updateInput,
    updateLockupDays,
  }
}

export type StakingDashboardStake = {
  token: StakingDashboardToken
}

export type TypedStakingDashboardState<T extends StakingDashboardStake> =
  ReturnType<typeof useStakingDashboardState> & T
