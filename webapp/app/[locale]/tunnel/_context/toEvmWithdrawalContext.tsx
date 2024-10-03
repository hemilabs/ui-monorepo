'use client'

import { createContext, ReactNode, useState } from 'react'

type ToEvmWithdrawOperations = 'idle' | 'prove' | 'claim'

type ToEvmWithdrawalContext = ReturnType<
  typeof useState<ToEvmWithdrawOperations>
>

export const ToEvmWithdrawalContext = createContext<ToEvmWithdrawalContext>([
  'idle',
  () => 'idle',
])

export const ToEvmWithdrawalProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const state = useState<ToEvmWithdrawOperations>('idle')

  return (
    <ToEvmWithdrawalContext.Provider value={state}>
      {children}
    </ToEvmWithdrawalContext.Provider>
  )
}
