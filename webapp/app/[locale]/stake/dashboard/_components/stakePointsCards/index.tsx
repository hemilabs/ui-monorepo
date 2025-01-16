import { Card } from 'components/card'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'

import communityIcon from './icons/community.svg'
import stakeIcon from './icons/stake.svg'
import starIcon from './icons/star.svg'

type Props = {
  heading: string
  icon: StaticImageData
  iconAlt: string
  points: string
}

const Heading = ({ heading }: Pick<Props, 'heading'>) => (
  <h6 className="text-sm font-medium text-neutral-500">{heading}</h6>
)

const Points = ({
  color = 'text-neutral-950',
  points,
}: { color?: 'text-neutral-950' | 'text-orange-500' } & Pick<
  Props,
  'points'
>) => <p className={`text-xl font-semibold ${color}`}>{points}</p>

const Container = ({ children }: { children: ReactNode }) => (
  <div className="h-24 w-full lg:max-w-72 [&>div]:overflow-hidden">
    <Card shadow="shadow-soft">
      <div className="relative">{children}</div>
    </Card>
  </div>
)

export const EarnedPoints = function () {
  const t = useTranslations('stake-page.dashboard')
  return (
    <Container>
      <div className="p-2">
        <div
          className="flex flex-shrink-0 flex-col gap-y-3 rounded-lg border border-solid border-[#FDEFE8] p-4"
          style={{
            // Easier to read here than converting it into a inline tailwind class or in another file (the config).
            background:
              'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.08) 14.89%, rgba(255, 108, 21, 0.08) 54.52%, rgba(255, 24, 20, 0.02) 98.87%), #FFF',
          }}
        >
          <Heading heading={t('total-earned-points')} />
          <Points color="text-orange-500" points="60.300" />
        </div>
      </div>
      <Image
        alt="Star icon"
        className="absolute right-0 top-0"
        height={67}
        src={starIcon}
        width={66}
      />
    </Container>
  )
}

export const TotalStaked = function () {
  const t = useTranslations('stake-page.dashboard')
  return (
    <Container>
      <div className="flex flex-shrink-0 flex-col gap-y-3 p-6">
        <Heading heading={t('total-staked')} />
        <Points points="$ 1,626,271,246.98" />
      </div>
      <Image
        alt="Community icon"
        className="absolute right-0 top-0"
        height={63}
        src={communityIcon}
        width={62}
      />
    </Container>
  )
}

export const YourStake = function () {
  const t = useTranslations('stake-page.dashboard')
  return (
    <Container>
      <div className="flex flex-shrink-0 flex-col gap-y-3 p-6">
        <Heading heading={t('your-stake')} />
        <Points points="$ 962.163" />
      </div>
      <Image
        alt="Stake icon"
        className="absolute right-0 top-0"
        height={67}
        src={stakeIcon}
        width={66}
      />
    </Container>
  )
}
