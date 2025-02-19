import { SubmitWhenConnectedToChain } from 'components/submitWhenConnectedToChain'
import { FormEvent, ReactNode } from 'react'
import { RemoteChain } from 'types/chain'

type Props = {
  expectedChainId: RemoteChain['id']
  onSubmit: (e: FormEvent) => void
  submitButton: ReactNode
}

export const DrawerCallToAction = ({
  expectedChainId,
  onSubmit,
  submitButton,
}: Props) => (
  <form className="mt-auto flex w-full [&>button]:w-full" onSubmit={onSubmit}>
    <SubmitWhenConnectedToChain
      chainId={expectedChainId}
      submitButton={submitButton}
    />
  </form>
)
