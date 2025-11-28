import { DrawerSection } from 'components/drawer'
import { ReactNode } from 'react'

import { CallToActionContainer } from './callToActionContainer'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  amount: ReactNode
  bottomSection?: ReactNode
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
}

export const ReviewOperation = ({
  amount,
  bottomSection,
  callToAction,
  steps,
}: Props) => (
  <>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DrawerSection>
        {amount}
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
