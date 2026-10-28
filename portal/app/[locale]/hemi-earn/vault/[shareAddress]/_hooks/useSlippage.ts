import {
  defaultDepositSlippage,
  defaultRedeemSlippage,
} from '../../../_constants/slippage'
import { clampSlippage, percentToBps } from '../../../_utils/slippage'
import { useVaultForm } from '../_context/vaultFormContext'
import { type VaultOperation } from '../_types/operations'

export const getDefaultSlippage = (operation: VaultOperation) =>
  operation === 'deposit' ? defaultDepositSlippage : defaultRedeemSlippage

export const useSlippage = function (operation: VaultOperation) {
  const { slippage } = useVaultForm()
  return clampSlippage(slippage ?? getDefaultSlippage(operation))
}

export const useSlippageBps = (operation: VaultOperation) =>
  percentToBps(useSlippage(operation))
