import Image from 'next/image'

import kernel from './kernel.png'

export const KernelIcon = () => (
  <Image alt="Kernel Icon" height={16} quality={100} src={kernel} width={16} />
)
