import { useCallback, useState } from 'react'

type Transaction = {
  id: string
  status: 'error' | 'loading' | 'success'
  text: string
  txHash?: string
}

export const useTransactionsList = function () {
  const [transactionsList, setTransactionList] = useState<Transaction[]>([])

  const addTransaction = useCallback(
    (transaction: Transaction) =>
      setTransactionList(prev => prev.concat(transaction)),
    [],
  )

  const clearTransactionList = useCallback(
    () => setTransactionList([]),
    [setTransactionList],
  )

  const updateTransaction = useCallback(function ({
    id,
    ...update
  }: Partial<Transaction>) {
    setTransactionList(prev =>
      prev.map(transaction =>
        transaction.id === id
          ? {
              ...transaction,
              ...update,
            }
          : transaction,
      ),
    )
  }, [])

  const delayedClearTransactionList = useCallback(
    function (delay: number = 5000) {
      const timeoutId = setTimeout(clearTransactionList, delay)
      return () => clearTimeout(timeoutId)
    },
    [clearTransactionList],
  )

  return {
    addTransaction,
    clearTransactionList,
    delayedClearTransactionList,
    transactionsList,
    updateTransaction,
  }
}
