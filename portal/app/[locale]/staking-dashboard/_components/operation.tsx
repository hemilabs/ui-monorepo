import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { Amount } from 'components/reviewOperation/amount'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SlidingSwitcher } from 'components/slidingSwitcher'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  // Replaces the single "Total amount" figure where one number can't describe the
  // operation - a claim settles several assets at once, and the staked HEMI isn't one.
  amountSlot?: ReactNode
  bottomSection?: ReactNode
  callToAction?: ReactNode
  isOperating?: boolean
  preview?: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
} & ComponentProps<typeof DrawerTopSection> &
  Omit<ComponentProps<typeof Amount>, 'value'> & {
    // Optional because `amountSlot` replaces it. A claim over several positions has no
    // single staked figure, and a zero invented to satisfy this would surface later.
    amount?: ComponentProps<typeof Amount>['value']
  }

export const Operation = ({
  amount,
  amountSlot,
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
    <div className="mb-3 flex min-h-21 flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={onClose} />
      <DrawerParagraph>{subheading}</DrawerParagraph>
    </div>
    <SlidingSwitcher
      first={preview}
      hideFirst={isOperating}
      second={
        <ReviewOperation
          amount={amountSlot ?? <Amount token={token} value={amount!} />}
          bottomSection={bottomSection}
          callToAction={callToAction}
          steps={steps}
        />
      }
    />
  </>
)
