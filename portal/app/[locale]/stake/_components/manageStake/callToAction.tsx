import { SubmitWhenConnected } from 'components/submitWhenConnected'
import { ReactNode } from 'react'

export const CallToAction = ({ submitButton }: { submitButton: ReactNode }) => (
  <div className="flex w-full [&>button]:w-full">
    <SubmitWhenConnected submitButton={submitButton} submitButtonSize="small" />
  </div>
)
