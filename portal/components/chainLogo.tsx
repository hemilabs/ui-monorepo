import { bitcoinTestnet, bitcoinMainnet } from 'btc-wallet/chains'
import { BtcLogo } from 'components/icons/btcLogo'
import { EthLogo } from 'components/icons/ethLogo'
import { hemiMainnet } from 'networks/hemiMainnet'
import { hemiTestnet } from 'networks/hemiTestnet'
import { mainnet } from 'networks/mainnet'
import { sepolia } from 'networks/sepolia'
import { orange600 } from 'styles'
import { type RemoteChain } from 'types/chain'

const HemiTokenWithBackground = () => (
  <svg
    fill="none"
    height={20}
    viewBox="0 0 20 20"
    width={20}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect fill="#FFEBD4" height={20} rx={10} width={20} />
    <path
      d="M11.153 4.002a.112.112 0 0 0-.13.092l-.745 4.302h-.556l-.745-4.302a.112.112 0 0 0-.13-.092c-2.645.521-4.673 2.815-4.84 5.619 0 .004-.007.122-.007.181v.196c0 2.974 2.085 5.449 4.85 5.997.062.01.12-.03.13-.093l.746-4.302h.556l.74 4.306c.012.063.07.103.131.092 2.645-.525 4.669-2.819 4.84-5.622 0-.004.007-.123.007-.182v-.196c.004-2.974-2.082-5.449-4.847-5.996Z"
      fill={orange600}
    />
  </svg>
)

export const ChainLogo = function ({
  chainId,
}: {
  chainId: RemoteChain['id']
}) {
  switch (chainId) {
    case bitcoinMainnet.id:
    case bitcoinTestnet.id:
      return <BtcLogo />
    case hemiMainnet.id:
    case hemiTestnet.id:
      return <HemiTokenWithBackground />
    case mainnet.id:
    case sepolia.id:
      return <EthLogo />
    default:
      return <HemiTokenWithBackground />
  }
}
