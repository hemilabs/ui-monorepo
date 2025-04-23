import { DrawerSection } from 'components/drawer'
import { ComponentProps, ReactNode } from 'react'

import { Amount } from './amount'
import { CallToActionContainer } from './callToActionContainer'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  bottomSection?: ReactNode
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
} & Omit<ComponentProps<typeof Amount>, 'value'> & {
    // rename value to amount
    amount: ComponentProps<typeof Amount>['value']
  }

export const ReviewOperation = ({
  amount,
  bottomSection,
  callToAction,
  steps,
  token,
}: Props) => (
  <>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DrawerSection>
        <Amount token={token} value={amount} />
        <div
          className="mt-4 flex flex-col gap-y-8"
          // use this to prevent layout shift for the gray container
          // calculate the max height depending on the number of steps
          // and add 20px for the "total" section
          style={{ height: `${144 * steps.length + 20}px` }}
        >
          {steps.map((stepProps, index) => (
            <Step key={index} position={index + 1} {...stepProps} />
          ))}
        </div>
      </DrawerSection>
      {bottomSection}
    </div>
    {!!callToAction && (
      <CallToActionContainer>{callToAction}</CallToActionContainer>
    )}
  </>
)
