import { Image } from 'components/image'
import { StakeProtocols } from 'types/stake'

import { protocolImages } from '../protocols/protocolImages'

type Props = {
  protocol: StakeProtocols
}

export const ProtocolImage = function ({ protocol }: Props) {
  const { className, height, src, width } = protocolImages[protocol]
  return (
    <Image
      alt={protocol}
      className={className}
      height={height}
      src={src}
      width={width}
    />
  )
}
