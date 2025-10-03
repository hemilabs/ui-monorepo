import Image, { type StaticImageData } from 'next/image'

type Props = {
  alt: string
  src: StaticImageData
}

export const PartnerImage = ({ alt, src }: Props) => (
  <Image
    alt={alt}
    className="mr-2 rounded-lg"
    height={32}
    src={src}
    width={32}
  />
)
