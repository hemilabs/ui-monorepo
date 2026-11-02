import { DrawerSection } from 'components/drawer'
import { ReactNode } from 'react'

import { CallToActionContainer } from './callToActionContainer'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  aboveAmount?: ReactNode
  aboveCallToAction?: ReactNode
  amount: ReactNode
  bottomSection?: ReactNode
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
}

export const ReviewOperation = ({
  aboveAmount,
  aboveCallToAction,
  amount,
  bottomSection,
  callToAction,
  steps,
}: Props) => (
  <>
    <div className="skip-parent-padding-x mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto">
      <DrawerSection>
        {!!aboveAmount && <div className="mb-4">{aboveAmount}</div>}
        {amount}
        <div
          className="mt-4 flex flex-col gap-y-8"
          // reserve the space up front so the gray container does not jump
          // while the steps resolve
          style={{ minHeight: `${144 * steps.length + 20}px` }}
        >
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
