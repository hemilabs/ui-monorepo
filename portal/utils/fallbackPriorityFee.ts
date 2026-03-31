import { hemiSepolia } from 'hemi-viem'

/** 1 Gwei in wei — default when RPC priority fee is too low. */
const oneGweiWei = BigInt(1_000_000_000)
/** Hemi Sepolia: low testnet gas — matches previous portal behavior. */
const hemiSepoliaFallbackPriorityFeeWei = BigInt(100_000)

export const getFallbackPriorityFeeForChain = (chainId: number): bigint =>
  chainId === hemiSepolia.id ? hemiSepoliaFallbackPriorityFeeWei : oneGweiWei
