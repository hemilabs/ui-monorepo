import { Value, ValueKind, store, Bytes, BigInt } from '@graphprotocol/graph-ts'
import { BaseWithdrawal } from './baseWithdrawal'

export class BtcWithdrawal extends BaseWithdrawal {
  constructor(id: Bytes) {
    super(id)
  }

  save(): void {
    let id = this.get('id')
    assert(id != null, 'Cannot save BtcWithdrawal entity without an ID')
    if (id) {
      assert(
        id.kind == ValueKind.BYTES,
        `Entities of type BtcWithdrawal must have an ID of type Bytes but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      )
      store.set('BtcWithdrawal', id.toBytes().toHexString(), this)
    }
  }

  static loadInBlock(id: Bytes): BtcWithdrawal | null {
    return changetype<BtcWithdrawal | null>(
      store.get_in_block('BtcWithdrawal', id.toHexString()),
    )
  }

  static load(id: Bytes): BtcWithdrawal | null {
    return changetype<BtcWithdrawal | null>(
      store.get('BtcWithdrawal', id.toHexString()),
    )
  }

  get to(): string {
    const value = this.get('to')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toString()
    }
  }

  set to(value: string) {
    this.set('to', Value.fromString(value))
  }

  get uuid(): BigInt {
    let value = this.get('uuid')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBigInt()
    }
  }

  set uuid(value: BigInt) {
    this.set('uuid', Value.fromBigInt(value))
  }

  get l1ChainId(): string {
    const value = this.get('l1ChainId')
    if (!value || value.kind == ValueKind.NULL) {
      return ''
    } else {
      return value.toString()
    }
  }

  set l1ChainId(value: string) {
    this.set('l1ChainId', Value.fromString(value))
  }
}
