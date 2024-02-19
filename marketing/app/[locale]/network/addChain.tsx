import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from 'ui-common/components/button'
import {
  useAccount,
  useWalletClient,
  type Chain,
  useMutation,
  useNetwork,
} from 'wagmi'

type Props = {
  chain: Chain
}

export const AddChain = function ({ chain }: Props) {
  const [isChainAdded, setIsChainAdded] = useState(false)

  const t = useTranslations('network')

  const { isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { chain: connectedChain } = useNetwork()

  const { status, mutate: addChain } = useMutation({
    mutationFn: () => walletClient?.addChain({ chain }),
    mutationKey: ['addChain', chain.id],
    onSuccess: () => setIsChainAdded(true),
  })

  // can't use this as initial value for useState because value from wallet is not
  // available in first render... and I'd rather not sync it with an effect
  const connectedToChain = connectedChain?.id === chain.id

  return (
    <>
      {!isConnected && <ConnectButton />}
      {!isChainAdded && isConnected && !connectedToChain && (
        <Button
          disabled={status === 'loading'}
          onClick={() => addChain()}
          size="small"
          type="button"
        >
          {t('add-to-wallet')}
        </Button>
      )}
      {(isChainAdded || connectedToChain) && (
        <>
          <svg
            fill="none"
            height="16"
            viewBox="0 0 16 16"
            width="16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.354 4.85378L6.35403 12.8538C6.30759 12.9003 6.25245 12.9372 6.19175 12.9623C6.13105 12.9875 6.06599 13.0004 6.00028 13.0004C5.93457 13.0004 5.86951 12.9875 5.80881 12.9623C5.74811 12.9372 5.69296 12.9003 5.64653 12.8538L2.14653 9.35378C2.05271 9.25996 2 9.13272 2 9.00003C2 8.86735 2.05271 8.7401 2.14653 8.64628C2.24035 8.55246 2.3676 8.49976 2.50028 8.49976C2.63296 8.49976 2.76021 8.55246 2.85403 8.64628L6.00028 11.7932L13.6465 4.14628C13.7403 4.05246 13.8676 3.99976 14.0003 3.99976C14.133 3.99976 14.2602 4.05246 14.354 4.14628C14.4478 4.2401 14.5006 4.36735 14.5006 4.50003C14.5006 4.63272 14.4478 4.75996 14.354 4.85378Z"
              fill="#16A34A"
            />
          </svg>
          <span className="text-green-600">{t('added')}</span>
        </>
      )}
    </>
  )
}
