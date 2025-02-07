import { StakeGraph } from '../../../_components/icons/stakeGraph'
import { StakeAndEarn } from '../../../_components/stakeAndEarn'

import { StakeLink } from './stakeLink'

export const WelcomeStake = () => (
  <div
    className="shadow-large flex flex-col items-center rounded-2xl border border-solid border-neutral-300/55 px-5
    pt-12 lg:mt-12 lg:h-[50dvh] lg:flex-row lg:justify-between lg:gap-x-12 lg:py-12 2xl:justify-evenly 2xl:gap-x-24"
    style={{
      background:
        'radial-gradient(100% 100% at 50% 0%, rgba(253, 239, 232, 0.16) 14.12%, rgba(255, 108, 21, 0.16) 32.29%, rgba(255, 24, 20, 0.03) 98.87%), #FFF',
    }}
  >
    <div className="flex flex-col items-center gap-y-7">
      <div className="[&>div>svg]:-translate-x-1/2 max-lg:[&>div>svg]:left-1/2 lg:[&>div>svg]:-translate-x-12">
        <StakeAndEarn />
      </div>
      <StakeLink />
    </div>
    <StakeGraph />
  </div>
)
