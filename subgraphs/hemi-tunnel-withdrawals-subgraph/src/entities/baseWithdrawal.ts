import {
  Entity,
  Value,
  ValueKind,
  Bytes,
  BigInt,
} from '@graphprotocol/graph-ts'

export class BaseWithdrawal extends Entity {
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
    this.set('amount', Value.fromBigInt(value))
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
    this.set('blockNumber', Value.fromBigInt(value))
  }

  get direction(): i32 {
    const value = this.get('direction')
    if (!value || value.kind == ValueKind.NULL) {
      return 0
    } else {
      return value.toI32()
    }
  }

  set direction(value: i32) {
    this.set('direction', Value.fromI32(value))
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
    this.set('from', Value.fromBytes(value))
  }

  get l2ChainId(): i32 {
    const value = this.get('l2ChainId')
    if (!value || value.kind == ValueKind.NULL) {
      return 0
    } else {
      return value.toI32()
    }
  }

  set l2ChainId(value: i32) {
    this.set('l2ChainId', Value.fromI32(value))
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
    this.set('l1Token', Value.fromBytes(value))
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
    this.set('l2Token', Value.fromBytes(value))
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
    this.set('id', Value.fromBytes(value))
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
    this.set('timestamp', Value.fromBigInt(value))
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
    this.set('transactionHash', Value.fromBytes(value))
  }
}
