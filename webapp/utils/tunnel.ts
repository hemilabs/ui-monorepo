import { MessageDirection, TokenBridgeMessage } from '@eth-optimism/sdk'

export const isDeposit = ({ direction }: TokenBridgeMessage) =>
  direction === MessageDirection.L1_TO_L2
