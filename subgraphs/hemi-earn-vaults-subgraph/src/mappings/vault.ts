import { BigInt, dataSource, ethereum } from '@graphprotocol/graph-ts'

import { ERC4626Vault } from '../../generated/HemiBTCVault/ERC4626Vault'
import { VaultHistory } from '../../generated/schema'

export function handleBlock(block: ethereum.Block): void {
  const daySeconds = BigInt.fromI32(86400)
  const dayTimestamp = block.timestamp.div(daySeconds).times(daySeconds)
  const vaultAddress = dataSource.address()

  const id = vaultAddress.toHexString() + '-' + dayTimestamp.toString()
  let entity = VaultHistory.load(id)
  if (entity == null) {
    entity = new VaultHistory(id)
    entity.vault = vaultAddress
    entity.timestamp = dayTimestamp
  }

  const vault = ERC4626Vault.bind(vaultAddress)
  const decimals = vault.decimals()
  const oneShare = BigInt.fromI32(10).pow(<u8>decimals)
  entity.shareValue = vault.convertToAssets(oneShare)
  entity.totalAssets = vault.totalAssets()
  entity.save()
}
