import { useQuery } from '@tanstack/react-query'
import { getOpportunityCampaigns } from 'utils/merkl'

const opportunityId = process.env.NEXT_PUBLIC_BTC_YIELD_OPPORTUNITY_ID

export const useMerklCampaigns = () =>
  useQuery({
    enabled: opportunityId !== undefined,
    queryFn: () =>
      getOpportunityCampaigns({ opportunityId: opportunityId! }).then(
        r => r.campaigns,
      ),
    queryKey: ['merkl-opportunity-campaigns', opportunityId],
  })
