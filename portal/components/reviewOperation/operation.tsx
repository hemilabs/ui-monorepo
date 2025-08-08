import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { Amount } from 'components/reviewOperation/amount'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  callToAction?: ReactNode
  bottomSection?: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
} & ComponentProps<typeof DrawerTopSection> &
  Omit<ComponentProps<typeof Amount>, 'value'> & {
    // rename value to amount
    amount: ComponentProps<typeof Amount>['value']
  }

export const Operation = ({
  amount,
  bottomSection,
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
    <ReviewOperation
      amount={amount}
      bottomSection={bottomSection}
      callToAction={callToAction}
      steps={steps}
      token={token}
    />
  </>
)
