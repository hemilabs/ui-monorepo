import {
  DrawerParagraph,
  DrawerSection,
  DrawerTopSection,
} from 'components/drawer'
import { Amount } from 'components/reviewOperation/amount'
import {
  Step,
  type StepPropsWithoutPosition,
} from 'components/reviewOperation/step'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
} & ComponentProps<typeof DrawerTopSection> &
  Omit<ComponentProps<typeof Amount>, 'value'> & {
    amount: ComponentProps<typeof Amount>['value']
  }

export const Operation = ({
  amount,
  callToAction,
  heading,
  onClose,
  steps,
  subheading,
  token,
}: Props) => (
  <>
    <div className="min-h-21 mb-3 flex flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={onClose} />
      <DrawerParagraph>{subheading}</DrawerParagraph>
    </div>
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
    </div>
    {!!callToAction && (
      <div
        className="mt-auto flex w-full flex-col items-end
      border-t border-solid border-neutral-300/55 bg-neutral-50 p-6"
      >
        {callToAction}
      </div>
    )}
  </>
)
