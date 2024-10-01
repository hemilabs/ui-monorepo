'use client'

import { createContext, ReactNode, useState } from 'react'
import { DepositTunnelOperation } from 'types/tunnel'

type ContextType = {
  addTransaction: (transaction: DepositTunnelOperation) => void
  clearTransactionsInMemory: () => void
  // While this could hold any transaction, currently it is only needed for
  // ERC20 deposits. So I'm narrowing down then type to that. We can change it later
  // if we see fit to use a more broad type.
  transactions: DepositTunnelOperation[]
}

export const TransactionsInProgressContext = createContext<ContextType>({
  addTransaction: () => undefined,
  clearTransactionsInMemory: () => undefined,
  transactions: [],
})

export const TransactionsInProgressProvider = function ({
  children,
}: {
  children: ReactNode
}) {
  const [transactions, setTransactions] = useState<DepositTunnelOperation[]>([])

  const value: ContextType = {
    addTransaction: (transaction: DepositTunnelOperation) =>
      setTransactions(prev => prev.concat(transaction)),
    clearTransactionsInMemory: () => setTransactions([]),
    transactions,
  }
  return (
    <TransactionsInProgressContext.Provider value={value}>
      {children}
    </TransactionsInProgressContext.Provider>
  )
}
