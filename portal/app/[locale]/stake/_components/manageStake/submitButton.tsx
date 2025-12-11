import { Button } from 'components/button'
import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { ReactNode } from 'react'

type Props = {
  disabled: boolean
  text: ReactNode
}

export const SubmitButton = ({ disabled, text }: Props) => (
  <div className="flex w-full [&>button]:w-full">
    <SubmitWhenConnected
      submitButton={
        <Button disabled={disabled} size="small" type="submit">
          {text}
        </Button>
      }
      submitButtonSize="small"
    />
  </div>
)
