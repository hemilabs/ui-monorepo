import { DrawerParagraph, DrawerTopSection } from 'components/drawer'
import { ReviewOperation } from 'components/reviewOperation'
import { type StepPropsWithoutPosition } from 'components/reviewOperation/step'
import { SlidingSwitcher } from 'components/slidingSwitcher'
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
    <SlidingSwitcher
      first={preview}
      second={
        <ReviewOperation
          amount={parseTokenUnits(amount, token).toString()}
          callToAction={callToAction}
          steps={steps}
          token={token}
        />
      }
      showFirst={isOperating}
    />
  </Form>
)
