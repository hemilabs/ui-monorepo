import Image from 'next/image'

import img from './unirouterPointsIcon.png'

export const UnirouterPointsIcon = () => (
  <div className="relative h-4 w-4">
    <Image alt="Unirouter Points" className="object-contain" fill src={img} />
  </div>
)
