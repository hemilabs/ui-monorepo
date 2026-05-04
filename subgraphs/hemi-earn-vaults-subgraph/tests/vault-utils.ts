import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import { newMockEvent } from 'matchstick-as'

export function createMockBlock(
  number: BigInt,
  timestamp: BigInt,
): ethereum.Block {
  const event = newMockEvent()
  const block = event.block
  block.number = number
  block.timestamp = timestamp
  return block
}
