import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { ReactNode } from 'react'

export const CallToAction = ({ submitButton }: { submitButton: ReactNode }) => (
  <div className="flex w-full px-4 md:px-6 [&>button]:w-full">
    <SubmitWhenConnectedToChain
      chainId={useHemi().id}
      submitButton={submitButton}
      submitButtonSize="small"
    />
  </div>
)
