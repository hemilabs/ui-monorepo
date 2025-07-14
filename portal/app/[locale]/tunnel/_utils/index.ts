import Big from 'big.js'
import { validateInput } from 'components/tokenInput/utils'
import { RemoteChain } from 'types/chain'
import { Token } from 'types/token'
import { getTunnelTokenSymbol, parseTokenUnits } from 'utils/token'
import { formatUnits } from 'viem'

type CanSubmit = Parameters<typeof validateInput>[0] & {
  chainId: RemoteChain['id']
  expectedChain: RemoteChain['name']
}

export const validateSubmit = function ({
  amountInput,
  balance,
  chainId,
  expectedChain,
  minAmount,
  operation,
  t,
  token,
}: CanSubmit) {
  const inputValidation = validateInput({
    amountInput,
    balance,
    minAmount,
    operation,
    symbolRenderer: getTunnelTokenSymbol,
    t,
    token,
  })

  if (!inputValidation.isValid) {
    return {
      canSubmit: false,
      error: inputValidation.error,
      errorKey: inputValidation.errorKey,
    }
  }
  // TODO this may be removed after https://github.com/hemilabs/ui-monorepo/issues/1231
  if (chainId !== token.chainId) {
    return {
      canSubmit: false,
      error: t('common.connect-to-network', {
        network: expectedChain,
      }),
      errorKey: 'connect-to-network',
    }
  }
  return { canSubmit: true, error: undefined, errorKey: undefined }
}

type GetTotal = {
  fees?: bigint
  fromInput: string
  fromToken: Token
}
export const getTotal = ({
  fees = BigInt(0),
  fromInput,
  fromToken,
}: GetTotal) =>
  formatUnits(
    BigInt(
      Big(parseTokenUnits(fromInput, fromToken).toString())
        .plus(fees.toString())
        .toFixed(),
    ),
    fromToken.decimals,
  )
