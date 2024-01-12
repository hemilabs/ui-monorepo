'use client'

import { useAccount } from 'wagmi'

type Props = { text: string }
export const OperationButton = function ({ text }: Props) {
  const { isConnected } = useAccount()
  return (
    <button
      className={`h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white  ${
        isConnected
          ? 'cursor-pointer hover:bg-opacity-80'
          : 'cursor-not-allowed bg-opacity-60'
      }`}
      disabled={!isConnected}
    >
      {text}
    </button>
  )
}
