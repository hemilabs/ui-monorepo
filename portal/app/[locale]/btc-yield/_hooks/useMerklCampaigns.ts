import { useQuery } from '@tanstack/react-query'
import { featureFlags } from 'app/featureFlags'
import { getOpportunityCampaigns } from 'utils/merkl'

import { opportunityId } from '../_utils'

export const useMerklCampaigns = () =>
  useQuery({
    enabled:
      featureFlags.enableBtcYieldClaimRewards && opportunityId !== undefined,
    queryFn: () => getOpportunityCampaigns({ opportunityId: opportunityId! }),
    queryKey: ['merkl-opportunity-campaigns', opportunityId],
  })
