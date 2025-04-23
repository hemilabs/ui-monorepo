import Image from 'next/image'

import babypieJewels from './babypieJewels.png'

export const BabypieJewelsIcon = () => (
  <Image
    alt="Babypie Jewels Icon"
    height={16}
    quality={100}
    src={babypieJewels}
    width={16}
  />
)
