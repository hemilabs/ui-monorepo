import Image from 'next/image'
import { StakeProtocols } from 'types/stake'

import { protocolImages } from '../protocols/protocolImages'

type Props = {
  protocol: StakeProtocols
}

export const ProtocolImage = function ({ protocol }: Props) {
  const { className, src } = protocolImages[protocol]
  return <Image alt={protocol} className={className} src={src} />
}
