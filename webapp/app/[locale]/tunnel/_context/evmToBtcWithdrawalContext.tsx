'use client'

import { createContext, ReactNode, useState } from 'react'

type EvmToBtcWithdrawOperationStatuses =
  | 'idle'
  | 'withdrawing'
  | 'challenging'
  | 'failed'
  | 'rejected'

type EvmToBtcWithdrawalContext = ReturnType<
  typeof useState<EvmToBtcWithdrawOperationStatuses>
>

export const EvmToBtcWithdrawalContext =
  createContext<EvmToBtcWithdrawalContext>(['idle', () => 'idle'])

export const EvmToBtcWithdrawalProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const state = useState<EvmToBtcWithdrawOperationStatuses>('idle')

  return (
    <EvmToBtcWithdrawalContext.Provider value={state}>
      {children}
    </EvmToBtcWithdrawalContext.Provider>
  )
}
