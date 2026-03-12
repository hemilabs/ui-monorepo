import { type Address, isAddress, getAddress } from 'viem'

/** Converts string to viem Address (`0x${string}`). Use when a lib/API expects Address but we have string (e.g. token.address). */
export const toChecksumAddress = (address: string): Address =>
  isAddress(address, { strict: false })
    ? getAddress(address)
    : (address as Address)
