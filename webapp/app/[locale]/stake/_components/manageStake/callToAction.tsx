import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { useHemi } from 'hooks/useHemi'
import { ReactNode } from 'react'

export const CallToAction = ({ submitButton }: { submitButton: ReactNode }) => (
  <div className="absolute bottom-1 left-0 right-0 flex px-4 md:px-6 [&>button]:w-full">
    <SubmitWhenConnectedToChain
      chainId={useHemi().id}
      submitButton={submitButton}
    />
  </div>
)
