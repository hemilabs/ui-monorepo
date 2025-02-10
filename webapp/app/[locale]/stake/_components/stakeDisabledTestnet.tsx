'use client'

import { ChangeToMainnet } from './changeToMainnet'
import { StakeGraph } from './icons/stakeGraph'
import { StakeAndEarn } from './stakeAndEarn'

export const StakeDisabledTestnet = () => (
  <div
    className="shadow-large flex flex-col items-center rounded-2xl border border-solid border-neutral-300/55 px-5
    pt-12 md:mt-12 lg:h-[60dvh] lg:flex-row lg:justify-evenly lg:gap-x-12 lg:py-12 2xl:gap-x-24"
    style={{
      background:
        'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.16) 14.12%, rgba(255, 108, 21, 0.16) 32.29%, rgba(255, 24, 20, 0.03) 98.87%), #FFF',
    }}
  >
    <div className="flex flex-col items-center gap-y-7">
      <div className="[&>div>svg]:lg:-translate-x-34 [&>div>svg]:-translate-x-1/2 [&>div>svg]:max-lg:left-1/2">
        <StakeAndEarn />
      </div>
      <ChangeToMainnet />
    </div>
    <StakeGraph />
  </div>
)
