import { HemiSymbol } from 'components/icons/hemiSymbol'
import { Link } from 'components/link'
import { landingPage } from 'utils/landingPage'

import { HemiLogoFull } from './hemiLogo'

const variants = {
  full: { className: 'w-full', logo: <HemiLogoFull /> },
  symbol: { className: 'h-6 w-6', logo: <HemiSymbol /> },
} as const

type Props = {
  variant: keyof typeof variants
}

export const HomeLink = ({ variant }: Props) => (
  <Link className={variants[variant].className} href={landingPage}>
    {variants[variant].logo}
  </Link>
)
