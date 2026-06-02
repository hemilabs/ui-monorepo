import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'

import { formatTokenAddress } from '../../_utils/formatTokenAddress'
import { getL1BridgePair } from '../../_utils/getL1BridgePair'

type Props = {
  address: EvmToken['address']
  networkName: string
}

export const TokenTableAddressCell = ({ address, networkName }: Props) => (
  <div className="flex min-w-0 flex-col">
    <span className="body-text-medium truncate text-neutral-950">
      {networkName}
    </span>
    <span className="body-text-normal truncate text-neutral-500">
      {formatTokenAddress(address)}
    </span>
  </div>
)

type L1AddressCellProps = {
  remoteNetworks: RemoteChain[]
  token: EvmToken
}

export const TokenTableL1AddressCell = function ({
  remoteNetworks,
  token,
}: L1AddressCellProps) {
  const pair = getL1BridgePair(token, remoteNetworks)

  return pair ? (
    <TokenTableAddressCell
      address={pair.address}
      networkName={pair.networkName}
    />
  ) : null
}
