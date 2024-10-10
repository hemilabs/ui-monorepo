import { WithdrawTunnelOperation } from 'types/tunnel'
import { isToEvmWithdraw } from 'utils/tunnel'

import { ReviewEvmWithdrawal } from './reviewEvmWithdrawal'

type Props = {
  onClose: () => void
  withdrawal: WithdrawTunnelOperation
}

export const ViewWithdrawal = function ({ onClose, withdrawal }: Props) {
  if (isToEvmWithdraw(withdrawal)) {
    return <ReviewEvmWithdrawal onClose={onClose} withdrawal={withdrawal} />
  }
  // Bitcoin withdrawals Will be implemented in incoming PRs
  return null
}
