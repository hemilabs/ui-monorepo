import { getRouteFlags } from 'app/routeFlags'

const routeFlags = getRouteFlags(import.meta.env)

export const featureFlags = {
  disableHemiEarnDeposits:
    import.meta.env.VITE_DISABLE_HEMI_EARN_DEPOSITS === 'true',
  enableHemiEarnPage: routeFlags.hemiEarn,
  enableHemiStakeCalculator: routeFlags.hemiStakeCalculator,
  enableSafeWallet: import.meta.env.VITE_ENABLE_SAFE_WALLET === 'true',
}
