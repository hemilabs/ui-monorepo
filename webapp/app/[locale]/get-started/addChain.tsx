import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from 'ui-common/components/button'
import { type Chain } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

type Props = {
  chain: Chain
}

export const AddChain = function ({ chain }: Props) {
  const [isChainAdded, setIsChainAdded] = useState(false)

  const t = useTranslations('get-started.network')

  const { chain: connectedChain, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  const { status, mutate: addChain } = useMutation({
    mutationFn: (c: Chain) => walletClient?.addChain({ chain: c }),
    onSuccess: () => setIsChainAdded(true),
  })

  // can't use this as initial value for useState because value from wallet is not
  // available in first render... and I'd rather not sync it with an effect
  const connectedToChain = connectedChain?.id === chain.id

  return (
    <>
      {!isConnected && (
        <div className="w-full [&>div>button]:w-full [&>div>button]:!text-center">
          <ConnectButton />
        </div>
      )}
      {!isChainAdded && isConnected && !connectedToChain && (
        <Button
          disabled={status === 'pending'}
          onClick={() => addChain(chain)}
          size="small"
          type="button"
        >
          {t('add-to-wallet')}
        </Button>
      )}
      {(isChainAdded || connectedToChain) && (
        <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-100 px-3 py-2">
          <svg
            fill="none"
            height="14"
            viewBox="0 0 14 14"
            width="14"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 5.33333L6 9L4.66667 7.66667M13 7C13 10.3137 10.3137 13 7 13C3.68629 13 1 10.3137 1 7C1 3.68629 3.68629 1 7 1C10.3137 1 13 3.68629 13 7Z"
              stroke="#10A732"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.33333"
            />
          </svg>
          <span className="text-green-600">{t('added')}</span>
        </div>
      )}
    </>
  )
}
