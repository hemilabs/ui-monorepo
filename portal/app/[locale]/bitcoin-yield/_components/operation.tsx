import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { Amount } from 'components/reviewOperation/amount'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SlidingSwitcher } from 'components/slidingSwitcher'
import { ComponentProps, ReactNode } from 'react'
import { parseTokenUnits } from 'utils/token'

type Props = {
  bottomSection?: ReactNode
  callToAction?: ReactNode
  isOperating?: boolean
  onSubmit: () => void
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
  onSubmit,
  preview,
  steps,
  subheading,
  token,
}: Props) => (
  <form
    className="drawer-content h-[95dvh] md:h-full"
    onSubmit={function (e) {
      e.preventDefault()
      onSubmit()
    }}
  >
    <div className="min-h-21 mb-3 flex flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={onClose} />
      <DrawerParagraph>{subheading}</DrawerParagraph>
    </div>
    <SlidingSwitcher
      first={preview}
      hideFirst={isOperating}
      second={
        <ReviewOperation
          amount={parseTokenUnits(amount, token).toString()}
          bottomSection={bottomSection}
          callToAction={callToAction}
          steps={steps}
          token={token}
        />
      }
    />
  </form>
)
