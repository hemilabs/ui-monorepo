'use client'

import { createContext, useContext, type ReactNode } from 'react'

import { type EarnPool } from '../../../types'
import { useVaultFormState } from '../_hooks/useVaultFormState'

type VaultFormContextValue = ReturnType<typeof useVaultFormState> & {
  pool: EarnPool
}

const VaultFormContext = createContext<VaultFormContextValue | undefined>(
  undefined,
)

export function VaultFormProvider({
  children,
  pool,
}: {
  children: ReactNode
  pool: EarnPool
}) {
  const state = useVaultFormState()

  return (
    <VaultFormContext.Provider value={{ ...state, pool }}>
      {children}
    </VaultFormContext.Provider>
  )
}

export function useVaultForm(): VaultFormContextValue {
  const ctx = useContext(VaultFormContext)
  if (!ctx) {
    throw new Error('useVaultForm must be used inside <VaultFormProvider>')
  }
  return ctx
}
