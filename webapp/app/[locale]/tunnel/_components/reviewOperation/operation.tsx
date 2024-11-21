import { ComponentProps, ReactNode } from 'react'

import { Amount } from './amount'
import { Header } from './header'
import { Step, type StepPropsWithoutPosition } from './step'

type Props = {
  callToAction?: ReactNode
  steps: StepPropsWithoutPosition[]
} & ComponentProps<typeof Header> &
  Omit<ComponentProps<typeof Amount>, 'value'> & {
    // rename value to amount
    amount: ComponentProps<typeof Amount>['value']
  }

export const Operation = ({
  amount,
  callToAction,
  onClose,
  steps,
  subtitle,
  title,
  token,
}: Props) => (
  <div className="flex h-full flex-col">
    <div className="mb-6 px-4">
      <Header onClose={onClose} subtitle={subtitle} title={title} />
    </div>
    <div className="border-y border-solid border-neutral-300/55 bg-neutral-50 p-6">
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
    </div>
    {!!callToAction && <div className="h-full px-4 py-6">{callToAction}</div>}
  </div>
)
