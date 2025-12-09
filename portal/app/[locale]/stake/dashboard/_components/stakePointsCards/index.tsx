import { Card } from 'components/card'
import { useTokenPrices } from 'hooks/useTokenPrices'
import Image, { StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'
import { ReactNode } from 'react'
import { formatFiatNumber, formatTVL } from 'utils/format'
import { calculateUsdValue } from 'utils/prices'
import { useAccount } from 'wagmi'

import { useHemiPoints } from '../../../_hooks/useHemiPoints'
import { useStakePositions } from '../../../_hooks/useStakedBalance'
import { useTotalStaked } from '../../../_hooks/useTotalStaked'

import communityIcon from './icons/community.svg'
import stakeIcon from './icons/stake.svg'
import starIcon from './icons/star.svg'

type Props = {
  heading: string
  icon: StaticImageData
  iconAlt: string
  points: string
}

const Text = ({ heading }: Pick<Props, 'heading'>) => (
  <p className="text-sm font-medium text-neutral-500">{heading}</p>
)

const Points = ({
  color = 'text-neutral-950',
  points,
}: { color?: 'text-neutral-950' | 'text-orange-600' } & Pick<
  Props,
  'points'
>) => <p className={`text-xl font-semibold ${color}`}>{points}</p>

const Container = ({ children }: { children: ReactNode }) => (
  <div className="h-24 w-full [&>div]:overflow-hidden">
    <Card>
      <div className="relative">{children}</div>
    </Card>
  </div>
)

export const EarnedPoints = function () {
  const { isConnected } = useAccount()
  const { data: points, isError, isLoading } = useHemiPoints()
  const t = useTranslations('stake-page.dashboard')

  const getPoints = function () {
    if (!isConnected || isError) {
      return '-'
    }
    if (isLoading) {
      return '...'
    }
    // technically, this should never happen, but a few reports in Sentry
    // show that it if somehow the user is connected, but the app failed to retrieve
    // the Address, it will reach this point, where the user is connected, but without any error
    // as the query is disabled. This line is a safety net.
    if (points === undefined) {
      return '-'
    }
    return points.toString()
  }

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
          <Text heading={t('total-earned-points')} />
          <Points color="text-orange-600" points={getPoints()} />
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
  const { data: prices } = useTokenPrices()
  const { isError, isPending, totalStake } = useTotalStaked()
  const t = useTranslations('stake-page.dashboard')

  const getPoints = function () {
    if (isError || prices === undefined) {
      return '-'
    }
    if (isPending) {
      return '...'
    }
    return formatTVL(totalStake)
  }

  return (
    <Container>
      <div className="flex flex-shrink-0 flex-col gap-y-3 p-6">
        <Text heading={t('total-staked-on-hemi')} />
        <Points points={getPoints()} />
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
  const { isConnected } = useAccount()
  const { data: prices, isPending: loadingPrices } = useTokenPrices()
  const { loading: loadingPosition, tokensWithPosition } = useStakePositions()
  const t = useTranslations('stake-page.dashboard')

  const getPoints = function () {
    if (!isConnected) {
      return '-'
    }
    if (loadingPosition || loadingPrices) {
      return '...'
    }
    if (prices === undefined) {
      // if Prices API is missing, return "-"
      return '-'
    }
    const userPosition = calculateUsdValue(tokensWithPosition, prices)
    return `$ ${formatFiatNumber(userPosition)}`
  }

  return (
    <Container>
      <div className="flex flex-shrink-0 flex-col gap-y-3 p-6">
        <Text heading={t('your-stake')} />
        <Points points={getPoints()} />
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
