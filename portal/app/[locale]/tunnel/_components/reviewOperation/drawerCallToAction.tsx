import { ButtonLoader } from 'components/buttonLoader'
import dynamic from 'next/dynamic'
import { FormEvent, ReactNode } from 'react'
import { RemoteChain } from 'types/chain'

const SubmitWhenConnectedToChain = dynamic(
  () =>
    import('components/submitWhenConnectedToChain').then(
      mod => mod.SubmitWhenConnectedToChain,
    ),
  {
    loading: () => <ButtonLoader />,
    ssr: false,
  },
)

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
  <form className="flex w-full [&>button]:w-full" onSubmit={onSubmit}>
    <SubmitWhenConnectedToChain
      chainId={expectedChainId}
      submitButton={submitButton}
    />
  </form>
)
