import Image from 'next/image'

import satoshi from './satoshi.png'

export const SatoshiPointsIcon = () => (
  <Image
    alt="Satoshi Icon"
    height={16}
    quality={100}
    src={satoshi}
    width={16}
  />
)
