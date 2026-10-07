import { DrawerSection } from 'components/drawer'
import { ReactNode } from 'react'

import { CallToActionContainer } from './callToActionContainer'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  aboveCallToAction?: ReactNode
  amount: ReactNode
  bottomSection?: ReactNode
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
}

export const ReviewOperation = ({
  aboveCallToAction,
  amount,
  bottomSection,
  callToAction,
  steps,
}: Props) => (
  <>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DrawerSection>
        {amount}
        <div className="mt-4 flex flex-col gap-y-8">
          {steps.map((stepProps, index) => (
            <Step key={index} position={index + 1} {...stepProps} />
          ))}
        </div>
      </DrawerSection>
      {bottomSection}
    </div>
    {aboveCallToAction}
    {!!callToAction && (
      <CallToActionContainer>{callToAction}</CallToActionContainer>
    )}
  </>
)
