'use client'

import { featureFlags } from 'app/featureFlags'
import { useStakeTokens } from 'hooks/useStakeTokens'

import { StakeAndEarnPointsGraphSmallIcon } from './_components/icons/stakeAndEarnPointsGraphSmall'
import { StakeAndEarnPointsSpecialLabel } from './_components/stakeAndEarnPointsSpecialLabel'
import { StakeStrategyTable } from './_components/stakeStrategyTable'
import welcomeStakeBackgroundImg from './_images/welcome_stake_background.png'

const Stake = function () {
  const stakeTokens = useStakeTokens()

  if (!featureFlags.stakeCampaignEnabled) return null

  return (
    <>
      <div
        className="absolute inset-0 z-10 opacity-80 mix-blend-overlay"
        style={{
          background: `url(${welcomeStakeBackgroundImg.src}) lightgray 50% / cover no-repeat`,
        }}
      ></div>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255, 102, 51, 0.2) 0%, rgba(255, 204, 153, 0.1) 50%, rgba(255, 255, 255, 0) 100%), ' +
            'radial-gradient(circle at top right, rgba(255, 102, 51, 0.2) 0%, rgba(255, 204, 153, 0.1) 50%, rgba(255, 255, 255, 0) 100%)',
        }}
      />
      <div className="flex flex-col items-center justify-center md:flex-row md:items-start md:justify-between">
        <StakeAndEarnPointsSpecialLabel
          gradientMode="secondary"
          textSize="text-4xl"
        />
        <StakeAndEarnPointsGraphSmallIcon />
      </div>
      <StakeStrategyTable data={stakeTokens} loading={false} />
    </>
  )
}

export default function Page() {
  return <Stake />
}
