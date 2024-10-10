import { FormEvent, ReactNode } from 'react'
import { type Chain } from 'viem'

import { SubmitWhenConnectedToChain } from '../submitWhenConnectedToChain'

type Props = {
  expectedChainId: Chain['id']
  onSubmit: (e: FormEvent) => void
  submitButton: ReactNode
}

export const DrawerCallToAction = ({
  expectedChainId,
  onSubmit,
  submitButton,
}: Props) => (
  <form className="flex [&>button]:w-full" onSubmit={onSubmit}>
    <SubmitWhenConnectedToChain
      chainId={expectedChainId}
      submitButton={submitButton}
    />
  </form>
)
