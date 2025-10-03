import { StakeGraph } from '../../../_components/icons/stakeGraph'
import { StakeAndEarn } from '../../../_components/stakeAndEarn'

import { StakeLink } from './stakeLink'

export const WelcomeStake = () => (
  <div
    className="mb-12 flex flex-col items-center rounded-xl px-5
    pt-12 shadow-md lg:mt-12 lg:h-[50dvh] lg:flex-row lg:justify-evenly lg:gap-x-44 lg:py-12 xl:gap-x-16"
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
