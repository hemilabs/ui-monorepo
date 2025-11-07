import { type Address, isAddress, getAddress } from 'viem'

export const toChecksumAddress = (address: string): Address =>
  isAddress(address, { strict: false })
    ? getAddress(address)
    : (address as Address)
