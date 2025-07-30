import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { ReactNode } from 'react'

export const CallToAction = ({ submitButton }: { submitButton: ReactNode }) => (
  <div className="flex w-full [&>button]:w-full">
    <SubmitWhenConnectedToChain
      chainId={useHemi().id}
      submitButton={submitButton}
      submitButtonSize="small"
    />
  </div>
)
