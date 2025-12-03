import { Toast } from 'components/toast'
import { useHemi } from 'hooks/useHemi'
import { formatEvmHash } from 'utils/format'
import { type Hash } from 'viem'

type Props = {
  description: string
  title: string
  txHash: Hash
}

export const SuccessToast = function ({ description, title, txHash }: Props) {
  const hemi = useHemi()
  const blockExplorerUrl = hemi.blockExplorers!.default.url

  const tx = {
    href: `${blockExplorerUrl}/tx/${txHash}`,
    label: formatEvmHash(txHash),
  }

  return <Toast description={description} title={title} tx={tx} />
}
