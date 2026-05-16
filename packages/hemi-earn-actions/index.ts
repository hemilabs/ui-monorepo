export {
  HEMI_EARN_AGENT_ADDRESS,
  HEMI_EARN_ROUTER_ADDRESS,
  HEMI_EARN_ROUTER_BIRTH_BLOCK,
  HEMI_EARN_SHARES,
  SVETBTC_OFT_ADDRESS,
  getHemiEarnAgentAddress,
  getHemiEarnRouterAddress,
  getHemiEarnRouterBirthBlock,
  getHemiEarnShares,
} from './src/constants'

export type {
  RequestDepositEvents,
  RequestKind,
  RequestRedeemEvents,
  RequestStatus,
} from './src/types'

// Vetro is the protocol Hemi Earn settles into on the Ethereum side. The
// re-exports here cover the StakingVault + Gateway anchors and helpers so
// the portal can preview cross-chain results without round-tripping to the
// Agent. Lives in the same package because every Hemi Earn pool is a Vetro
// pool today, and likely will remain Vetro-only for the foreseeable future.
export {
  HEMI_EARN_VETRO_ANCHORS,
  VETBTC_PEGGED_ADDRESS,
  type HemiEarnVetroAnchor,
  getGatewayForShare,
  getPeggedTokenForShare,
  getStakingVaultForShare,
} from './src/vetro/constants'
export { gatewayAbi } from './src/vetro/gatewayAbi'
