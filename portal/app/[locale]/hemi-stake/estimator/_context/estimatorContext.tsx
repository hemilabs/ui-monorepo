import { useAmount } from 'hooks/useAmount'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { twoYears } from '../../_utils/lockCreationTimes'

export type EstimatorScope = 'new-position' | 'with-my-positions'

type EstimatorContextValue = {
  amount: string
  inputDays: string
  lockupDays: number
  scope: EstimatorScope
  updateAmount: (value: string) => void
  updateInputDays: (days: string) => void
  updateLockupDays: (days: number) => void
  updateScope: (scope: EstimatorScope) => void
}

const EstimatorContext = createContext<EstimatorContextValue | undefined>(
  undefined,
)

export function EstimatorProvider({ children }: { children: ReactNode }) {
  const [amount, updateAmount] = useAmount('10000')
  const [inputDays, updateInputDays] = useState(String(twoYears))
  const [lockupDays, updateLockupDays] = useState(twoYears)
  const [scope, updateScope] = useState<EstimatorScope>('new-position')

  return (
    <EstimatorContext.Provider
      value={{
        amount,
        inputDays,
        lockupDays,
        scope,
        updateAmount,
        updateInputDays,
        updateLockupDays,
        updateScope,
      }}
    >
      {children}
    </EstimatorContext.Provider>
  )
}

export function useEstimator() {
  const ctx = useContext(EstimatorContext)
  if (!ctx) {
    throw new Error('useEstimator must be used inside <EstimatorProvider>')
  }
  return ctx
}
