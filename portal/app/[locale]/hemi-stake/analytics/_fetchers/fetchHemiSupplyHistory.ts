import { type SupplyPoint } from '../_utils/supplyHistory'

// TODO - drop this file when the endpoint tracked in
// https://github.com/hemilabs/ui-monorepo/issues/2286 is available
import sample from './hemiSupplyHistory.json'

// TODO read the history from the endpoint tracked in
// https://github.com/hemilabs/ui-monorepo/issues/2286. Until it ships, this is
// a snapshot of what that endpoint returns, not generated data.
export const fetchHemiSupplyHistory = async () => sample as SupplyPoint[]
