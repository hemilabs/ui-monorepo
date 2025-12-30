# merkl-claim-rewards

A viem extension package that provides actions for interacting with Merkl reward distribution contracts.

## Installation

This is a private package that can only be used within the scope of this monorepo. To use it in your project within the monorepo, add it to your `package.json`:

```json
{
  "dependencies": {
    "merkl-claim-rewards": "1.0.0"
  }
}
```

Then run `npm install` from the root of the monorepo.

## Overview

This package provides wallet actions for claiming rewards from Merkl distribution contracts. It follows the standard viem extension patterns and includes both execution functions and encoding functions for gas estimation.

## Usage

### Basic Import

```typescript
import {
  claimAllRewards,
  encodeClaimAllRewards,
} from 'merkl-claim-rewards/actions'
import type { ClaimAllRewardsEvents } from 'merkl-claim-rewards'
```

### Claiming All Rewards

The `claimAllRewards` function allows you to claim multiple rewards in a single transaction:

```typescript
import { createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { hemi } from 'viem/chains'
import { claimAllRewards } from 'merkl-claim-rewards/actions'

// Setup your wallet client
const account = privateKeyToAccount('0x...')
const client = createWalletClient({
  account,
  chain: hemi,
  transport: http(),
})

// Claim rewards
const { promise, emitter } = claimAllRewards({
  account: account.address,
  amounts: [parseUnits('100', 18), parseUnits('50', 18)],
  client,
  distributorAddress: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae',
  proofs: [
    ['0x...', '0x...'], // Proof for first reward
    ['0x...', '0x...'], // Proof for second reward
  ],
  tokens: ['0x...', '0x...'], // Token addresses
  users: [account.address, account.address],
})

// Listen to events
emitter.on('pre-claim-all-rewards', () => {
  console.log('Starting claim process...')
})

emitter.on('user-signed-claim-all-rewards', hash => {
  console.log('Transaction signed:', hash)
})

emitter.on('claim-all-rewards-transaction-succeeded', receipt => {
  console.log('Rewards claimed successfully!', receipt)
})

emitter.on('claim-all-rewards-failed', error => {
  console.error('Failed to claim rewards:', error)
})

// Wait for completion
try {
  await promise
} catch (error) {
  console.error('Claim operation failed:', error)
}
```

### Gas Estimation

Use the encoding function for gas estimation before executing the transaction:

```typescript
import { encodeClaimAllRewards } from 'merkl-claim-rewards/actions'

// Encode the transaction data
const data = encodeClaimAllRewards({
  amounts: [parseUnits('100', 18), parseUnits('50', 18)],
  proofs: [
    ['0x...', '0x...'],
    ['0x...', '0x...'],
  ],
  tokens: ['0x...', '0x...'],
  users: [account.address, account.address],
})

const gasEstimate = await estimateGas(client, {
  account: account.address,
  data,
  to: distributorAddress,
})
```

## Events

The `claimAllRewards` function emits events defined in [types.ts](src/types.ts#L8-L17). See the `ClaimAllRewardsEvents` type for the complete list of events and their parameters.

## API Reference

See the JSDoc comments for detailed parameter and return type documentation:

- [`claimAllRewards`](src/actions/wallet/claimAllRewards.ts#L139-L149) - Claims multiple rewards in a single transaction
- [`encodeClaimAllRewards`](src/actions/wallet/claimAllRewards.ts#L151-L161) - Encodes claim transaction data for gas estimation
