'use client'

import { createContext, ReactNode, useState } from 'react'

type BtcToEvmDepositOperationStatuses =
  | 'idle'
  | 'depositing'
  | 'claiming'
  | 'failed'
  | 'rejected'

type BtcToEvmDepositContext = ReturnType<
  typeof useState<BtcToEvmDepositOperationStatuses>
>

export const BtcToEvmDepositContext = createContext<BtcToEvmDepositContext>([
  'idle',
  () => 'idle',
])

export const BtcToEvmDepositProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const state = useState<BtcToEvmDepositOperationStatuses>('idle')

  return (
    <BtcToEvmDepositContext.Provider value={state}>
      {children}
    </BtcToEvmDepositContext.Provider>
  )
}
