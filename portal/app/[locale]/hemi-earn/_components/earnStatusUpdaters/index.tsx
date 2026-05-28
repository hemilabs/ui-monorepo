import { EarnDepositsStatusUpdater } from './earnDepositsStatusUpdater'

// Mounted in the hemi-earn layout. Mirrors the `<TunnelStatusUpdaters>`
// composition pattern in `portal/components/tunnelStatusUpdaters/index.tsx`:
// invisible watcher components that drive cross-route polling and
// query-cache invalidations. Today there's only a deposit updater; withdraw
// and any claim/recover-specific watchers will compose here without
// restructuring.
export const EarnStatusUpdaters = () => <EarnDepositsStatusUpdater />
