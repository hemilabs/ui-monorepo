import { TEST_PRIVATE_KEY } from '@hemilabs/anvil-fork-setup/utils'
import { sVetBtcAddress } from '@vetro-protocol/earn'
import { gateways } from '@vetro-protocol/gateway'
import { type Address } from 'viem'

// Ethereum-side pegged token backing the vetBTC gateway. Not exported by any
// package — in production the portal reads `Gateway.PEGGED_TOKEN()` on-chain,
// but the sandbox setup needs the address BEFORE deploying the gateway. Update
// this if Vetro ever redeploys the pegged token contract.
export const VETBTC_PROD: Address = '0xf196C68233464A16CFDa319a47c21f4cECa62001'

const btcGateway = gateways.find(g => g.pegBaseSymbol === 'BTC')
if (!btcGateway) {
  throw new Error(
    "No gateway with pegBaseSymbol='BTC' in @vetro-protocol/gateway",
  )
}
export const GATEWAY_PROD: Address = btcGateway.address

export const STAKING_PROD: Address = sVetBtcAddress

export const HEMI_CHAIN_ID = 43111

export const DEFAULT_FORK_URL = 'http://127.0.0.1:8545'
export const DEFAULT_UPSTREAM_RPC = 'https://rpc.hemi.network/rpc'

export const DEFAULT_DEPLOYER_PK = TEST_PRIVATE_KEY
