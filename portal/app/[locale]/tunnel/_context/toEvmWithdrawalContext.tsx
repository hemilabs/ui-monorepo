'use client'

import { createContext, ReactNode, useState } from 'react'

type ToEvmWithdrawOperationStatuses =
  | 'idle'
  | 'withdrawing'
  | 'proving'
  | 'claiming'
  | 'failed'
  | 'rejected'

type ToEvmWithdrawalContext = ReturnType<
  typeof useState<ToEvmWithdrawOperationStatuses>
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
  const state = useState<ToEvmWithdrawOperationStatuses>('idle')

  return (
    <ToEvmWithdrawalContext.Provider value={state}>
      {children}
    </ToEvmWithdrawalContext.Provider>
  )
}
