import { StakingDashboardToken } from 'types/stakingDashboard'

/**
 * //TODO - Generates a mocked list of tokens for temporary use during development.
 *
 * @remarks
 * This function is temporary and should be replaced with real data from a reliable source.
 *
 * @returns An array of {@link StakingDashboardToken} objects representing mocked governance tokens.
 */
export const generateStakingDashboardTokens = (): StakingDashboardToken[] => [
  {
    address: '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e',
    amount: '1.000.000 veHEMI',
    apy: '10%',
    chainId: 1,
    decimals: 18,
    extensions: {
      birthBlock: 18450000,
      bridgeInfo: {
        optimism: {
          tokenAddress: `0xBridgeTokenOptimism000000000000000001`,
        },
      },
      l1LogoURI: 'https://hemilabs.github.io/token-list/logos/hemibtc.svg',
      priceSymbol: 'veHEMI',
      stakeSymbol: 'veHEMI',
      tunnel: true,
      tunnelSymbol: 'veHEMI',
    },
    lockupPeriod: '48 months',
    logoURI: 'https://hemilabs.github.io/token-list/logos/hemibtc.svg',
    name: 'veHEMI',
    percentageRemaining: 75,
    symbol: 'hemi',
    timeRemaining: '36 months',
    transaction: `0xabcd...ef0001`,
  },
  {
    address: '0xec46E0EFB2EA8152da0327a5Eb3FF9a43956F13e',
    amount: '2.000.000 veHEMI',
    apy: '8%',
    chainId: 1,
    decimals: 18,
    extensions: {
      birthBlock: 18450000,
      bridgeInfo: {
        optimism: {
          tokenAddress: `0xBridgeTokenOptimism000000000000000002`,
        },
      },
      l1LogoURI: 'https://hemilabs.github.io/token-list/logos/hemibtc.svg',
      priceSymbol: 'veHEMI',
      stakeSymbol: 'veHEMI',
      tunnel: true,
      tunnelSymbol: 'veHEMI',
    },
    lockupPeriod: '6 days',
    logoURI: 'https://hemilabs.github.io/token-list/logos/hemibtc.svg',
    name: 'veHEMI',
    percentageRemaining: 0,
    symbol: 'hemi',
    timeRemaining: '0 days',
    transaction: `0xabcd...ef0002`,
  },
]
