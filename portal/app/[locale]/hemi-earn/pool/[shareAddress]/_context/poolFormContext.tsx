'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { type EarnAsset, type EarnPool } from '../../../types'
import { usePoolFormState } from '../_hooks/usePoolFormState'

type PoolFormContextValue = ReturnType<typeof usePoolFormState> & {
  pool: EarnPool
  selectedAsset: EarnAsset
  setSelectedAsset: (asset: EarnAsset) => void
}

const PoolFormContext = createContext<PoolFormContextValue | undefined>(
  undefined,
)

export function PoolFormProvider({
  children,
  pool,
}: {
  children: ReactNode
  pool: EarnPool
}) {
  const state = usePoolFormState()
  const [selectedAssetAddress, setSelectedAssetAddress] = useState(
    () => pool.assets[0].address,
  )

  // When the pool changes (route swap), reset the selection to the first asset.
  useEffect(
    function resetSelectionOnPoolChange() {
      setSelectedAssetAddress(pool.assets[0].address)
    },
    [pool.shareAddress, pool.assets],
  )

  const selectedAsset = useMemo(
    () =>
      pool.assets.find(a => a.address === selectedAssetAddress) ??
      pool.assets[0],
    [pool.assets, selectedAssetAddress],
  )

  const setSelectedAsset = useCallback(function (asset: EarnAsset) {
    setSelectedAssetAddress(asset.address)
  }, [])

  return (
    <PoolFormContext.Provider
      value={{ ...state, pool, selectedAsset, setSelectedAsset }}
    >
      {children}
    </PoolFormContext.Provider>
  )
}

export function usePoolForm(): PoolFormContextValue {
  const ctx = useContext(PoolFormContext)
  if (!ctx) {
    throw new Error('usePoolForm must be used inside <PoolFormProvider>')
  }
  return ctx
}
