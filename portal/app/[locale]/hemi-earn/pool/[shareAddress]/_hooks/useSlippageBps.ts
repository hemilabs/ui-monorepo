import {
  defaultDepositSlippage,
  defaultRedeemSlippage,
} from '../../../_constants/slippage'
import { clampSlippage, percentToBps } from '../../../_utils/slippage'
import { usePoolForm } from '../_context/poolFormContext'
import { type PoolOperation } from '../_types/operations'

export const getDefaultSlippage = (operation: PoolOperation) =>
  operation === 'deposit' ? defaultDepositSlippage : defaultRedeemSlippage

export const useSlippageBps = function (operation: PoolOperation) {
  const { slippage } = usePoolForm()
  return percentToBps(clampSlippage(slippage ?? getDefaultSlippage(operation)))
}
