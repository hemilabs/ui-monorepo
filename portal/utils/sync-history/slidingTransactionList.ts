import pDoWhilst from 'p-do-whilst'

type CreateSlidingTransactionList<T> = {
  getTransactionsBatch: (pivotTxId: string) => Promise<T[]>
  pivotTxId: string
  processTransactions: (transactions: T[], pivotTxId: string) => Promise<void>
  txIdGetter: (transactions: T[]) => string
}

export const createSlidingTransactionList = function <T>({
  getTransactionsBatch,
  pivotTxId,
  processTransactions,
  txIdGetter,
}: CreateSlidingTransactionList<T>) {
  let innerPivotTxId = pivotTxId

  const run = () =>
    pDoWhilst(
      async function () {
        const transactions = await getTransactionsBatch(innerPivotTxId)

        innerPivotTxId =
          transactions.length > 0 ? txIdGetter(transactions) : undefined

        await processTransactions(transactions, innerPivotTxId)
        return transactions
      },
      transactions => transactions.length > 0,
    )

  return {
    run,
  }
}
