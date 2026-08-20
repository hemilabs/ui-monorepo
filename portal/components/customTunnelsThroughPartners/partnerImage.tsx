import { Image } from 'components/image'

type Props = {
  alt: string
  src: string
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
