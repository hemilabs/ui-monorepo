import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SlidingSwitcher } from 'components/slidingSwitcher'
import { ComponentProps, ReactNode } from 'react'

type Props = {
  amount: ReactNode
  bottomSection?: ReactNode
  callToAction?: ReactNode
  isOperating?: boolean
  onSubmit?: VoidFunction
  preview?: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
} & ComponentProps<typeof DrawerTopSection>

export const Operation = function ({
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
}: Props) {
  const review = (
    <ReviewOperation
      amount={amount}
      bottomSection={bottomSection}
      callToAction={callToAction}
      steps={steps}
    />
  )
  return (
    <form
      className="drawer-content h-[95dvh] md:h-full"
      onSubmit={function (e) {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <div className="min-h-21 mb-3 flex flex-col gap-y-3">
        <DrawerTopSection heading={heading} onClose={onClose} />
        <DrawerParagraph>{subheading}</DrawerParagraph>
      </div>
      {preview ? (
        <SlidingSwitcher
          first={preview}
          hideFirst={isOperating}
          second={review}
        />
      ) : (
        review
      )}
    </form>
  )
}
