import { Value, ValueKind, store, Bytes } from '@graphprotocol/graph-ts'

import { BaseWithdrawal } from './baseWithdrawal'

export class EvmWithdrawal extends BaseWithdrawal {
  constructor(id: Bytes) {
    super(id)
  }

  save(): void {
    const id = this.get('id')
    assert(id != null, 'Cannot save EvmWithdrawal entity without an ID')
    if (id) {
      assert(
        id.kind == ValueKind.BYTES,
        `Entities of type EvmWithdrawal must have an ID of type Bytes but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      )
      store.set('EvmWithdrawal', id.toBytes().toHexString(), this)
    }
  }

  static loadInBlock(id: Bytes): EvmWithdrawal | null {
    return changetype<EvmWithdrawal | null>(
      store.get_in_block('EvmWithdrawal', id.toHexString()),
    )
  }

  static load(id: Bytes): EvmWithdrawal | null {
    return changetype<EvmWithdrawal | null>(
      store.get('EvmWithdrawal', id.toHexString()),
    )
  }

  get l1ChainId(): i32 {
    const value = this.get('l1ChainId')
    if (!value || value.kind == ValueKind.NULL) {
      return 0
    } else {
      return value.toI32()
    }
  }

  set l1ChainId(value: i32) {
    this.set('l1ChainId', Value.fromI32(value))
  }

  get to(): Bytes {
    const value = this.get('to')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set to(value: Bytes) {
    this.set('to', Value.fromBytes(value))
  }
}
