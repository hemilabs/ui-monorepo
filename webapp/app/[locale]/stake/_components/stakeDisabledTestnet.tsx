'use client'

import { ChangeToMainnet } from './changeToMainnet'
import { StakeGraph } from './icons/stakeGraph'
import { StakeAndEarn } from './stakeAndEarn'

export const StakeDisabledTestnet = () => (
  <div
    className="shadow-large flex flex-col items-center rounded-2xl border border-solid border-neutral-300/55 px-5
    pt-12 md:mt-12 md:h-[60dvh] md:flex-row md:justify-evenly md:gap-x-24 md:py-12"
    style={{
      background:
        'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.16) 14.12%, rgba(255, 108, 21, 0.16) 32.29%, rgba(255, 24, 20, 0.03) 98.87%), #FFF',
    }}
  >
    <div className="flex flex-col items-center gap-y-7">
      <StakeAndEarn />
      <ChangeToMainnet />
    </div>
    <StakeGraph />
  </div>
)
