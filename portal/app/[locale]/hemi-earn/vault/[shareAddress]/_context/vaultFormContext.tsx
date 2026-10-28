import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { isAddressEqual } from 'viem'

import { type EarnAsset, type EarnVault } from '../../../types'
import { useVaultFormState } from '../_hooks/useVaultFormState'

type VaultFormContextValue = ReturnType<typeof useVaultFormState> & {
  vault: EarnVault
  selectedAsset: EarnAsset
  setSelectedAsset: (asset: EarnAsset) => void
}

const VaultFormContext = createContext<VaultFormContextValue | undefined>(
  undefined,
)

export function VaultFormProvider({
  children,
  vault,
}: {
  children: ReactNode
  vault: EarnVault
}) {
  const state = useVaultFormState()
  const [selectedAssetAddress, setSelectedAssetAddress] = useState(
    () => vault.assets[0].address,
  )

  useEffect(
    function resetSelectionOnVaultChange() {
      setSelectedAssetAddress(vault.assets[0].address)
    },
    [vault.shareAddress, vault.assets],
  )

  const selectedAsset = useMemo(
    () =>
      vault.assets.find(a => isAddressEqual(a.address, selectedAssetAddress)) ??
      vault.assets[0],
    [vault.assets, selectedAssetAddress],
  )

  const setSelectedAsset = useCallback(function (asset: EarnAsset) {
    setSelectedAssetAddress(asset.address)
  }, [])

  return (
    <VaultFormContext.Provider
      value={{ ...state, selectedAsset, setSelectedAsset, vault }}
    >
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
