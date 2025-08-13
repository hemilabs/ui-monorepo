import { Value } from '@graphprotocol/graph-ts'

import { LockedPosition as BasePosition } from '../../generated/schema'

export class LockedPosition extends BasePosition {
  // needed because AssemblyScript does not compile otherwise
  static load(id: string): LockedPosition | null {
    return changetype<LockedPosition | null>(BasePosition.load(id))
  }

  set status(value: string) {
    const allowedStatuses = ['active', 'withdrawn']
    if (!allowedStatuses.includes(value)) {
      throw new Error('Status must be either "active" or "withdrawn"')
    }
    this.set('status', Value.fromString(value))
  }
}
