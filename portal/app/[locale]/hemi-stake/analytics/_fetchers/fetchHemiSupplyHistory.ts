import fetchPlusPlus from 'fetch-plus-plus'

import { type SupplyPeriod, type SupplyPoint } from '../_utils/supplyHistory'

const supplyHistoryUrl = `${import.meta.env.VITE_PORTAL_API_URL}/supply-history`

export const fetchHemiSupplyHistory = (period: SupplyPeriod) =>
  fetchPlusPlus(`${supplyHistoryUrl}/${period}`, {
    method: 'GET',
  }) as Promise<SupplyPoint[]>
