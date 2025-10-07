import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { Amount } from 'components/reviewOperation/amount'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  bottomSection?: ReactNode
  callToAction?: ReactNode
  isOperating?: boolean
  preview?: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
} & ComponentProps<typeof DrawerTopSection> &
  Omit<ComponentProps<typeof Amount>, 'value'> & {
    amount: ComponentProps<typeof Amount>['value']
  }

export const Operation = ({
  amount,
  bottomSection,
  callToAction,
  heading,
  isOperating = true,
  onClose,
  preview,
  steps,
  subheading,
  token,
}: Props) => (
  <>
    <div className="min-h-21 mb-3 flex flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={onClose} />
      <DrawerParagraph>{subheading}</DrawerParagraph>
    </div>
    <div className="skip-parent-padding-x relative h-full overflow-hidden">
      <div
        className={`absolute inset-0 flex flex-col overflow-y-hidden transition-transform duration-500 ${
          isOperating ? 'invisible -translate-x-full' : 'translate-x-0'
        }`}
      >
        {preview}
      </div>
      <div
        className={`absolute inset-0 flex flex-col pb-1 transition-transform duration-500 ${
          isOperating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ReviewOperation
          amount={amount}
          bottomSection={bottomSection}
          callToAction={callToAction}
          steps={steps}
          token={token}
        />
      </div>
    </div>
  </>
)
