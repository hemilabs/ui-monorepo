import { formatEvmAddress } from 'utils/format'
import { isNativeAddress } from 'utils/nativeToken'
import { isAddress } from 'viem'

export const formatTokenAddress = (address: string) =>
  isNativeAddress(address) || !isAddress(address)
    ? address
    : formatEvmAddress(address)
