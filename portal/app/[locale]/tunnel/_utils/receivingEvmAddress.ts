import { type Address, getAddress, isAddress, zeroAddress } from 'viem'

type Props = {
  customAddress: string
  customAddressEnabled: boolean
  walletAddress: Address | undefined
}

const hasChecksum = (hex: string) =>
  hex !== hex.toLowerCase() && hex !== hex.toUpperCase()

const isValidReceiver = function (address: string): address is Address {
  if (!isAddress(address, { strict: false })) {
    return false
  }
  if (hasChecksum(address.slice(2)) && getAddress(address) !== address) {
    return false
  }
  return getAddress(address) !== zeroAddress
}

const getErrorKey = function ({
  customAddress,
  customAddressEnabled,
}: Omit<Props, 'walletAddress'>) {
  if (!customAddressEnabled) {
    return undefined
  }
  if (customAddress === '') {
    return 'enter-a-custom-address' as const
  }
  return isValidReceiver(customAddress)
    ? undefined
    : ('input-a-correct-custom-address' as const)
}

const getReceivingAddress = function ({
  customAddress,
  customAddressEnabled,
  walletAddress,
}: Props) {
  if (!customAddressEnabled) {
    return walletAddress
  }
  return isValidReceiver(customAddress) ? getAddress(customAddress) : undefined
}

export const resolveReceivingEvmAddress = (props: Props) => ({
  errorKey: getErrorKey(props),
  isCustomAddressValid: isValidReceiver(props.customAddress),
  receivingAddress: getReceivingAddress(props),
})
