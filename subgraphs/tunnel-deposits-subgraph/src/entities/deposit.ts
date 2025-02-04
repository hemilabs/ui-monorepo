import {
  Entity,
  Value,
  ValueKind,
  store,
  Bytes,
  BigInt,
} from '@graphprotocol/graph-ts'

export class Deposit extends Entity {
  constructor(id: Bytes) {
    super()
    this.set('id', Value.fromBytes(id))
  }

  get amount(): BigInt {
    const value = this.get('amount')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBigInt()
    }
  }

  set amount(value: BigInt) {
    this.setBigInt('amount', value)
  }

  get blockNumber(): BigInt {
    const value = this.get('blockNumber')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBigInt()
    }
  }

  set blockNumber(value: BigInt) {
    this.setBigInt('blockNumber', value)
  }

  get direction(): i32 {
    const value = this.get('direction')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toI32()
    }
  }

  set direction(value: i32) {
    this.setI32('direction', value)
  }

  get from(): Bytes {
    const value = this.get('from')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set from(value: Bytes) {
    this.setBytes('from', value)
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

  get l1ChainId(): i32 {
    const value = this.get('l1ChainId')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toI32()
    }
  }

  set l1ChainId(value: i32) {
    this.setI32('l1ChainId', value)
  }

  get l1Token(): Bytes {
    const value = this.get('l1Token')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set l1Token(value: Bytes) {
    this.setBytes('l1Token', value)
  }

  get l2ChainId(): i32 {
    const value = this.get('l2ChainId')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toI32()
    }
  }

  set l2ChainId(value: i32) {
    this.setI32('l2ChainId', value)
  }

  get l2Token(): Bytes {
    const value = this.get('l2Token')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set l2Token(value: Bytes) {
    this.setBytes('l2Token', value)
  }

  save(): void {
    const id = this.get('id')
    assert(id != null, 'Cannot save Deposit entity without an ID')
    if (id) {
      assert(
        id.kind == ValueKind.BYTES,
        `Entities of type Deposit must have an ID of type Bytes but the id '${id.displayData()}' is of type ${id.displayKind()}`,
      )
      store.set('Deposit', id.toBytes().toHexString(), this)
    }
  }

  get timestamp(): BigInt {
    const value = this.get('timestamp')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBigInt()
    }
  }

  set timestamp(value: BigInt) {
    this.setBigInt('timestamp', value)
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
    this.setBytes('to', value)
  }

  get transactionHash(): Bytes {
    const value = this.get('transactionHash')
    if (!value || value.kind == ValueKind.NULL) {
      throw new Error('Cannot return null for a required field.')
    } else {
      return value.toBytes()
    }
  }

  set transactionHash(value: Bytes) {
    this.setBytes('transactionHash', value)
  }
}
