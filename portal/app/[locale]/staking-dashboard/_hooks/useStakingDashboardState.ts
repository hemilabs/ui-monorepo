import { useHemiToken } from 'app/[locale]/claim/_hooks/useHemiToken'
import { useNetworks } from 'hooks/useNetworks'
import { useNetworkType } from 'hooks/useNetworkType'
import { useCallback, useEffect, useReducer } from 'react'
import { type RemoteChain } from 'types/chain'
import { type StakingDashboardToken } from 'types/stakingDashboard'
import { findChainById } from 'utils/chain'
import { sanitizeAmount } from 'utils/form'
import { getNativeToken } from 'utils/nativeToken'
import { type NoPayload, type Payload } from 'utils/typeUtilities'
import { type Chain } from 'viem'

type Lockup = {
  days?: number
  valid?: boolean
}

type StakingDashboardState = {
  estimatedApy: number
  input: string
  hydrated: boolean
  lockup: Lockup
  networkId: RemoteChain['id']
  token: StakingDashboardToken
}

type Action<T extends string> = {
  type: T
}

type ResetStateAfterOperation = Action<'resetStateAfterOperation'> & NoPayload
type UpdateEstimatedApy = Action<'updateEstimatedApy'> & Payload<number>
type UpdateHydrated = Action<'updateHydrated'> & NoPayload
type UpdateLockup = Action<'updateLockup'> & Payload<Lockup>
type UpdateInput = Action<'updateInput'> & Payload<string>
type UpdateToken = Action<'updateToken'> & Payload<StakingDashboardToken>

type ToggleTestnetMainnet = Action<'toggleTestnetMainnet'> &
  Payload<Pick<StakingDashboardState, 'networkId'>>

type Actions =
  | ResetStateAfterOperation
  | UpdateEstimatedApy
  | UpdateHydrated
  | UpdateInput
  | UpdateLockup
  | UpdateToken
  | ToggleTestnetMainnet

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

    case 'updateHydrated':
      return { ...state, hydrated: true }

    case 'updateLockup':
      return { ...state, lockup: { ...state.lockup, ...payload } }

    case 'updateToken':
      return { ...state, token: payload }

    case 'toggleTestnetMainnet':
      return { ...state, ...payload }

    default:
      // if a switch statement is missing on all possible actions
      // this will fail on compile time
      return compilationError(type)
  }
}

type StakingDashboardFunctionEvents = {
  [K in Exclude<
    Actions['type'],
    'toggleTestnetMainnet' | 'updateToken' | 'updateHydrated'
  >]: (payload?: Extract<Actions, { type: K }>['payload']) => void
}

export const useStakingDashboardState = function (): StakingDashboardState &
  StakingDashboardFunctionEvents {
  const [networkType] = useNetworkType()
  const hemiToken = useHemiToken()

  // This sets the default chain ID to the first EVM remote network,
  // because useHemiToken is not guaranteed to return a token (temporary),
  // and we need a default token to initialize the state.
  // The token will be updated later in the effect.
  const { evmRemoteNetworks } = useNetworks()
  const chainId = evmRemoteNetworks[0].id

  const [state, dispatch] = useReducer(reducer, {
    estimatedApy: 9.6, // TODO - Placeholder for estimated APY, replace with actual logic
    hydrated: false,
    input: '0',
    lockup: {
      days: 732, // Default to 2 years
      valid: true,
    },
    networkId: chainId,
    token: getNativeToken(chainId),
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

  const updateLockup = useCallback(function (payload: UpdateLockup['payload']) {
    dispatch({ payload, type: 'updateLockup' })
  }, [])

  const isTestnet = findChainById(state.networkId)?.testnet ?? false

  useEffect(
    function syncHemiTokenAndNetwork() {
      // TODO - If hemiToken is undefined (currently we only have it for Hemi Sepolia),
      // then use the default token for the current network.
      // This is a placeholder until the actual token is set.
      const token = hemiToken ?? getNativeToken(state.networkId)

      if ((networkType === 'testnet') !== isTestnet) {
        dispatch({
          payload: { networkId: token.chainId },
          type: 'toggleTestnetMainnet',
        })
      }

      dispatch({
        payload: token as StakingDashboardToken,
        type: 'updateToken',
      })

      dispatch({
        type: 'updateHydrated',
      })
    },
    [hemiToken, networkType, isTestnet, state.networkId],
  )

  return {
    ...state,
    resetStateAfterOperation: useCallback(
      () => dispatch({ type: 'resetStateAfterOperation' }),
      [],
    ),
    updateEstimatedApy,
    updateInput,
    updateLockup,
  }
}

export type StakingDashboardStake = {
  networkId: Chain['id']
  token: StakingDashboardToken
}

export type TypedStakingDashboardState<T extends StakingDashboardStake> =
  ReturnType<typeof useStakingDashboardState> & T
