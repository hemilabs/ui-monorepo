import { Image } from 'components/image'
import { StakeProtocols } from 'types/stake'

import { protocolImages } from '../protocols/protocolImages'

type Props = {
  protocol: StakeProtocols
}

export const ProtocolImage = ({ protocol }: Props) => (
  <Image alt={protocol} {...protocolImages[protocol]} />
)
