'use client'

import { useAccount } from 'wagmi'

type Props = { disabled: boolean; text: string }
export const OperationButton = function ({ disabled, text }: Props) {
  const { isConnected } = useAccount()
  const shouldDisable = !isConnected || disabled
  return (
    <button
      className={`h-14 w-full cursor-pointer rounded-xl bg-black text-base text-white ${
        shouldDisable
          ? 'cursor-not-allowed bg-opacity-60'
          : 'cursor-pointer hover:bg-opacity-80'
      }`}
      disabled={shouldDisable}
    >
      {text}
    </button>
  )
}
