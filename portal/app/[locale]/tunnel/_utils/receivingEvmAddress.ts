import { type Address, getAddress, isAddress, zeroAddress } from 'viem'

type Props = {
  customAddress: string
  customAddressEnabled: boolean
  walletAddress: Address | undefined
}

const isValidReceiver = (address: string): address is Address =>
  isAddress(address, { strict: false }) && getAddress(address) !== zeroAddress

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
