'use client'

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useState,
} from 'react'

export type ToEvmWithdrawOperationStatuses =
  | 'idle'
  | 'withdrawing'
  | 'proving'
  | 'claiming'
  | 'failed'
  | 'rejected'

type ToEvmWithdrawalContext = [
  ToEvmWithdrawOperationStatuses,
  Dispatch<SetStateAction<ToEvmWithdrawOperationStatuses>>,
]

export const ToEvmWithdrawalContext = createContext<ToEvmWithdrawalContext>([
  'idle',
  () => undefined,
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
