import { useQuery } from '@tanstack/react-query'

/**
 * Mock data for rewards per veHEMI per epoch
 * Real data API example (as of Aug 1, 2025)
 *
 * Structure:
 * - Epochs 0-4: No rewards (before mid-September)
 * - Epochs 5-15: Active rewards period (~2 months)
 * - Epochs 16-59: No current rewards
 *
 * Each value represents HEMI rewards per veHEMI voting power unit
 */
const mockRewards: number[] = [
  0, 0, 0, 0, 0, 0.001568591580787026, 0.0013109145314805126,
  0.001315494423850489, 0.0013125789297960368, 0.001297088999298091,
  0.0012626642676638487, 0.0012098896075914487, 0.0012295941609868904,
  0.0011910981259157976, 0.0012080145361143449, 0.0012272852978478517, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]

export const useRewardsPerVeHEMI = () =>
  useQuery({
    queryFn: () => Promise.resolve(mockRewards),
    queryKey: ['rewardsPerVeHEMI'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
