'use client'

import { hemi } from 'hemi-metadata'
import { useTranslations } from 'next-intl'
import { useAccount, useNetwork, useWalletClient } from 'wagmi'

export function AddNetworkToWallet() {
  const { isConnected } = useAccount()
  const { chain } = useNetwork()
  const t = useTranslations()
  const { data: walletClient, status } = useWalletClient()

  if (!isConnected || chain.id === hemi.id || status !== 'success') {
    return null
  }

  return (
    <button
      className="flex w-full cursor-pointer items-center rounded-xl bg-white px-6 py-4"
      onClick={() => walletClient.addChain({ chain: hemi })}
      type="button"
    >
      <div className="bg-hemi-gradient mr-2 h-8 w-8 rounded-full"></div>
      <p className="mr-auto text-base text-black">
        {t('common.add-hemi-to-wallet')}
      </p>
      <svg
        fill="none"
        height="10"
        viewBox="0 0 14 10"
        width="14"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M13.5303 4.46967C13.8232 4.76256 13.8232 5.23744 13.5303 5.53033L9.53033 9.53033C9.23744 9.82322 8.76256 9.82322 8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967L11.1893 5.75L1 5.75C0.585787 5.75 0.25 5.41421 0.25 5C0.25 4.58579 0.585787 4.25 1 4.25L11.1893 4.25L8.46967 1.53033C8.17678 1.23744 8.17678 0.762563 8.46967 0.46967C8.76256 0.176776 9.23744 0.176776 9.53033 0.46967L13.5303 4.46967Z"
          fill="#28303F"
          fillRule="evenodd"
          opacity="0.4"
        />
        <path
          d="M13.5303 4.46967C13.8232 4.76256 13.8232 5.23744 13.5303 5.53033L9.53033 9.53033C9.23744 9.82322 8.76256 9.82322 8.46967 9.53033C8.17678 9.23744 8.17678 8.76256 8.46967 8.46967L11.9708 5.00254L8.46967 1.53033C8.17678 1.23744 8.17678 0.762563 8.46967 0.46967C8.76256 0.176776 9.23744 0.176776 9.53033 0.46967L13.5303 4.46967Z"
          fill="#28303F"
        />
      </svg>
    </button>
  )
}
