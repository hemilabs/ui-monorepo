// The three `VeHemiEpochRewards` entries the withdraw flow needs, copied verbatim from
// `packages/ve-hemi-rewards/epochRewardsAbi.ts`.
//
// Copied rather than imported: any new workspace edge makes pnpm re-resolve peers across
// the whole graph, which is ~1,100 lines of lockfile churn for three signatures - and
// every line of that has to go through security review.
//
// Nothing else is duplicated; the addresses stay in `ve-hemi-rewards` and are passed in.
// `portal/test/veHemiEpochRewardsFragments.test.ts` fails if these drift.
export const veHemiEpochRewardsFragments = [
  {
    inputs: [],
    name: 'veHemi',
    outputs: [{ internalType: 'contract IVeHemi', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'capturePositionClass',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'positionClass',
    outputs: [
      { internalType: 'uint64', name: 'transferableAfter', type: 'uint64' },
      { internalType: 'bool', name: 'forfeitable', type: 'bool' },
      { internalType: 'bool', name: 'captured', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
