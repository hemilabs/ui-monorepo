import { type InputError } from 'components/tokenInput/utils'
import { type EvmToken } from 'types/token'
import { parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

import { computeIsLoading, type PreviewIssue } from './formState'

export const getTypedAssetAmount = ({
  input,
  isTokensMode,
  token,
}: {
  input: string
  isTokensMode: boolean
  token: EvmToken
}) => (isTokensMode ? parseTokenUnits(input, token) : BigInt(0))

export const deriveWithdrawShares = ({
  assetShares,
  input,
  isTokensMode,
  shareToken,
}: {
  assetShares: bigint | undefined
  input: string
  isTokensMode: boolean
  shareToken: EvmToken
}) =>
  isTokensMode ? (assetShares ?? BigInt(0)) : parseTokenUnits(input, shareToken)

export const getWithdrawValidationTarget = ({
  assetToken,
  isTokensMode,
  maxAssetOut,
  shareBalance,
  shareToken,
}: {
  assetToken: EvmToken
  isTokensMode: boolean
  maxAssetOut: bigint | undefined
  shareBalance: bigint
  shareToken: EvmToken
}) =>
  isTokensMode
    ? { balance: maxAssetOut, token: assetToken }
    : { balance: shareBalance, token: shareToken }

export const applyWithdrawSharesGuard = function ({
  baseError,
  baseErrorKey,
  baseValid,
  insufficientBalanceError,
  isTokensMode,
  shareBalance,
  shares,
  shareValueLoaded,
}: {
  baseError: string | undefined
  baseErrorKey: InputError | undefined
  baseValid: boolean
  insufficientBalanceError: string
  isTokensMode: boolean
  shareBalance: bigint
  shares: bigint
  shareValueLoaded: boolean
}): {
  errorKey: InputError | undefined
  validationError: string | undefined
  validInput: boolean
} {
  const sharesExceedBalance =
    isTokensMode && shareValueLoaded && shares > shareBalance

  return {
    errorKey: sharesExceedBalance ? 'insufficient-balance' : baseErrorKey,
    validationError: sharesExceedBalance ? insufficientBalanceError : baseError,
    validInput: baseValid && !sharesExceedBalance,
  }
}

export const resolveWithdrawInputValues = ({
  assetOut,
  assetToken,
  input,
  isTokensMode,
  shares,
  shareToken,
}: {
  assetOut: bigint
  assetToken: EvmToken
  input: string
  isTokensMode: boolean
  shares: bigint
  shareToken: EvmToken
}) => ({
  assetValue: isTokensMode ? input : formatUnits(assetOut, assetToken.decimals),
  sharesValue: isTokensMode ? formatUnits(shares, shareToken.decimals) : input,
})

export const computeWithdrawSubmitLoading = ({
  balanceLoaded,
  isAllowanceLoading,
  isAssetsToSharesLoading,
  isPreviewLoading,
  isTokensMode,
  validInput,
}: {
  balanceLoaded: boolean
  isAllowanceLoading: boolean
  isAssetsToSharesLoading: boolean
  isPreviewLoading: boolean
  isTokensMode: boolean
  validInput: boolean
}) =>
  computeIsLoading({
    balanceLoaded,
    isAllowanceLoading,
    isPreviewLoading,
    validInput,
  }) ||
  (isTokensMode && validInput && isAssetsToSharesLoading)

export const resolveRoundToZeroIssue = ({
  isAssetsToSharesLoading,
  isTokensMode,
  shares,
  validInput,
}: {
  isAssetsToSharesLoading: boolean
  isTokensMode: boolean
  shares: bigint
  validInput: boolean
}): PreviewIssue | undefined =>
  isTokensMode && validInput && !isAssetsToSharesLoading && shares === BigInt(0)
    ? 'amount-too-small'
    : undefined
