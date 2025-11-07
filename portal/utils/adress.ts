import { isAddress, getAddress } from 'viem'

export const toChecksumAddress = (address: string) =>
  isAddress(address, { strict: false }) ? getAddress(address) : address
