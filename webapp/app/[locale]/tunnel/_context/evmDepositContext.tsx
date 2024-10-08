'use client'

import { createContext, ReactNode, useState } from 'react'

type EvmDepositOperationStatuses = 'idle' | 'depositing' | 'failed' | 'rejected'

type EvmDepositContext = ReturnType<
  typeof useState<EvmDepositOperationStatuses>
>

export const EvmDepositContext = createContext<EvmDepositContext>([
  'idle',
  () => 'idle',
])

export const EvmDepositProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const state = useState<EvmDepositOperationStatuses>('idle')

  return (
    <EvmDepositContext.Provider value={state}>
      {children}
    </EvmDepositContext.Provider>
  )
}
