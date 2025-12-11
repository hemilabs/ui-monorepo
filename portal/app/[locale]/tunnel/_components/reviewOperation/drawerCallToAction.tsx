import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { FormEvent, ReactNode } from 'react'

type Props = {
  onSubmit: (e: FormEvent) => void
  submitButton: ReactNode
}

export const DrawerCallToAction = ({ onSubmit, submitButton }: Props) => (
  <form className="flex w-full [&>button]:w-full" onSubmit={onSubmit}>
    <SubmitWhenConnected submitButton={submitButton} submitButtonSize="small" />
  </form>
)
