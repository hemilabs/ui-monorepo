import { Entity, Value, ValueKind, store, Bytes } from '@graphprotocol/graph-ts'

export class Withdrawal extends Entity {
  constructor(id: Bytes) {
    super()
    this.setBytes('id', id)
  }

  get id(): Bytes {
    const value = this.get('id')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set id(value: Bytes) {
    this.setBytes('id', value)
  }

  get claimTxHash(): Bytes | null {
    const value = this.get('claimTxHash')
    if (!value || value.kind == ValueKind.NULL) {
      return null
    } else {
      return value.toBytes()
    }
  }

  set claimTxHash(value: Bytes | null) {
    if (value === null) {
      this.unset('claimTxHash')
    } else {
      this.setBytes('claimTxHash', value)
    }
  }

  get proveTxHash(): Bytes | null {
    const value = this.get('proveTxHash')
    if (!value || value.kind == ValueKind.NULL) {
      return null
    } else {
      return value.toBytes()
    }
  }

  set proveTxHash(value: Bytes | null) {
    if (value === null) {
      this.unset('proveTxHash')
    } else {
      this.setBytes('proveTxHash', value)
    }
  }

  save(): void {
    const id = this.get('id')
    assert(id != null, 'Cannot save Withdrawal entity without an id')
    if (id) {
      assert(
        id.kind == ValueKind.BYTES,
        `Entities of type Withdrawal must have an id of type Bytes but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      )
      store.set('Withdrawal', id.toBytes().toHexString(), this)
    }
  }

  static load(id: Bytes): Withdrawal | null {
    return changetype<Withdrawal | null>(
      store.get('Withdrawal', id.toHexString()),
    )
  }
}
