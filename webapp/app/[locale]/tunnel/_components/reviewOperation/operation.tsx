import { ReviewOperation } from 'components/reviewOperation'
import { Amount } from 'components/reviewOperation/amount'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ComponentProps, ReactNode } from 'react'

import { Header } from './header'

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
  <>
    <div className="mb-3">
      <Header onClose={onClose} subtitle={subtitle} title={title} />
    </div>
    <ReviewOperation
      amount={amount}
      callToAction={callToAction}
      steps={steps}
      token={token}
    />
  </>
)
