import { useTranslations } from 'next-intl'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'
import { getTokenSymbol, parseTokenUnits } from 'utils/token'

const checkInputIsNotZero = (input: string) => /0\.[0]*[1-9]/.test(input)

type CanSubmit = {
  amountInput: string
  balance: bigint
  minAmount?: string
  operation: 'deposit' | 'stake' | 'unstake' | 'withdrawal'
  symbolRenderer?: (token: Token) => string
  t: ReturnType<typeof useTranslations<never>>
  token: Token
}

export const inputErrors = [
  'enter-an-amount',
  'insufficient-balance',
  'less-than-min-value',
] as const
type InputError = (typeof inputErrors)[number]

export const isInputError = (error: string): error is InputError =>
  (inputErrors as readonly string[]).includes(error)

type ValidationResult = {
  isValid: boolean
  errorKey: InputError | undefined
  error?: string
}

/**
 * Validates a token input amount against various constraints such as minimum amount,
 * balance, and token type. Returns a validation result indicating whether the input is valid,
 * and provides an appropriate error message and key if not.
 *
 * @param params - The parameters for validation.
 * @param params.amountInput - The user input amount as a string.
 * @param params.balance - The user's current token balance as a bigint.
 * @param params.minAmount - The minimum allowed amount as a string (optional).
 * @param params.operation - The operation type (e.g., "deposit", "withdraw") used for error messages.
 * @param params.symbolRenderer - A function to render the token symbol (optional).
 * @param params.t - The translation function for error messages.
 * @param params.token - The token object containing metadata such as decimals and symbol.
 * @returns An object containing the validation result, error message, and error key.
 */
export const validateInput = function ({
  amountInput,
  balance,
  minAmount,
  operation,
  symbolRenderer = getTokenSymbol,
  t,
  token,
}: CanSubmit): ValidationResult {
  const amount = parseTokenUnits(amountInput, token)
  // this is the smallest amount that can be represented with the given number of decimals
  const minAmountParsed = minAmount ?? `0.${'0'.repeat(token.decimals - 1)}1`

  if (amount <= BigInt(0)) {
    // here this means that the value is 0.0000...X, where X is not 0 something
    if (amountInput.startsWith('0.') && checkInputIsNotZero(amountInput)) {
      // but if that value, when parsed, is 0n, then it means that the input
      // is smaller than the minimum value representable given the
      // amount of decimals.
      return {
        error: t(`common.min-amount-${operation}`, {
          amount: minAmountParsed,
          symbol: symbolRenderer(token),
        }),
        errorKey: 'less-than-min-value',
        isValid: false,
      }
    }
    return {
      error: t('common.enter-an-amount'),
      errorKey: 'enter-an-amount',
      isValid: false,
    }
  }
  if (amount < parseTokenUnits(minAmountParsed, token)) {
    return {
      error: t(`common.min-amount-${operation}`, {
        amount: minAmountParsed,
        symbol: symbolRenderer(token),
      }),
      errorKey: 'less-than-min-value',
      isValid: false,
    }
  }
  // For native tokens, the amount can't be equal to the balance, as fees must be considered.
  // For ERC20, the amount can be equal to the balance.
  if (amount > balance || (isNativeToken(token) && amount === balance)) {
    return {
      error: t('common.insufficient-balance', {
        symbol: symbolRenderer(token),
      }),
      errorKey: 'insufficient-balance',
      isValid: false,
    }
  }
  return { error: undefined, errorKey: undefined, isValid: true }
}
