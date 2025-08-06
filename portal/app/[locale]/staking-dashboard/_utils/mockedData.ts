import { type StakingDashboardOperation } from 'types/stakingDashboard'

/**
 * //TODO - Generates a mocked list of staking operations for temporary use during development.
 *
 * @remarks
 * This function is temporary and should be replaced with real data from a reliable source.
 *
 * @returns An array of {@link StakingDashboardOperation} objects representing mocked operations.
 */
export const generateStakingDashboardOperations =
  (): StakingDashboardOperation[] => [
    {
      amount: '100000000000',
      apy: '10%',
      chainId: 743111,
      lockupPeriod: '48 months',
      percentageRemaining: 75,
      timeRemaining: '36 months',
      token: '0x931d9e210530184C321EA4ee6238cCB4D0AB5236',
      transactionHash: '0xabcd...ef0001',
    },
    {
      amount: '20000000000',
      apy: '8%',
      chainId: 743111,
      lockupPeriod: '6 days',
      percentageRemaining: 0,
      timeRemaining: '0 days',
      token: '0x931d9e210530184C321EA4ee6238cCB4D0AB5236',
      transactionHash: '0xabcd...ef0002',
    },
  ]
