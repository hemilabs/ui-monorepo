import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { ReactNode } from 'react'
import { StakeToken } from 'types/stake'
import { parseTokenUnits } from 'utils/token'

import { Form } from './form'

type Props = {
  amount: string
  callToAction?: ReactNode
  closeDrawer: () => void
  heading: string
  isOperating: boolean
  onSubmit: () => void
  preview: ReactNode
  steps: StepPropsWithoutPosition[]
  subheading: string
  token: StakeToken
}

export const Operation = ({
  amount,
  callToAction,
  closeDrawer,
  heading,
  isOperating,
  onSubmit,
  preview,
  steps,
  subheading,
  token,
}: Props) => (
  <Form onSubmit={onSubmit}>
    <div className="mb-8 flex flex-col gap-y-3">
      <DrawerTopSection heading={heading} onClose={closeDrawer} />
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
        className={`absolute inset-0 pb-1 transition-transform duration-500 ${
          isOperating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ReviewOperation
          amount={parseTokenUnits(amount, token).toString()}
          callToAction={callToAction}
          steps={steps}
          token={token}
        />
      </div>
    </div>
  </Form>
)
