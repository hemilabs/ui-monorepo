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
      amount: '1000000000000000000000000',
      apy: '10%',
      chainId: 743111,
      lockupPeriod: '48 months',
      percentageRemaining: 75,
      timeRemaining: '36 months',
      token: '0xbaacf81C8341c3Cb983BC48051Cc7377d2A2Eb93',
      transactionHash:
        '0x08a875c5014f4b4132bdd16008854a124f09a940179c99fa1ce731919a99dab2',
    },
    {
      amount: '5000000000000000000000000',
      apy: '8%',
      chainId: 743111,
      lockupPeriod: '6 days',
      percentageRemaining: 0,
      timeRemaining: '0 days',
      token: '0xbaacf81C8341c3Cb983BC48051Cc7377d2A2Eb93',
      transactionHash:
        '0x3b5b86000291333647a61156dbd91cf24e788160db5c1b6780439f6bc5613a18',
    },
  ]
