import { DrawerSection } from 'components/drawer'
import { ComponentProps, ReactNode } from 'react'

import { Amount } from './amount'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
} & Omit<ComponentProps<typeof Amount>, 'value'> & {
    // rename value to amount
    amount: ComponentProps<typeof Amount>['value']
  }

export const ReviewOperation = ({
  amount,
  callToAction,
  steps,
  token,
}: Props) => (
  <>
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
    {!!callToAction && (
      <div className="flex h-full items-end pt-3">{callToAction}</div>
    )}
  </>
)
