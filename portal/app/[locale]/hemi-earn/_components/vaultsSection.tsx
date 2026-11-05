import { VaultsList } from './vaultsList'
import { VetroDataDisclaimer } from './vetroDataDisclaimer'

export const VaultsSection = () => (
  <div className="mt-6 w-full">
    <VaultsList />
    <div className="mt-3">
      <VetroDataDisclaimer />
    </div>
  </div>
)
