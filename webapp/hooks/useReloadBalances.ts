import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEffect } from 'react'
import { type EvmToken } from 'types/token'
import { isNativeToken } from 'utils/token'

type UseReloadBalances = {
  fromToken: EvmToken
  toToken: EvmToken
  status: string
}
export const useReloadBalances = function ({
  fromToken,
  toToken,
  status,
}: UseReloadBalances) {
  const operatesNativeToken = isNativeToken(fromToken)

  const { refetchBalance: refetchFromNativeToken } = useNativeTokenBalance(
    fromToken.chainId,
  )
  const { refetchTokenBalance: refetchFromTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const { refetchBalance: refetchToToken } = useNativeTokenBalance(
    toToken.chainId,
    operatesNativeToken,
  )

  const { refetchTokenBalance: refetchToTokenBalance } = useTokenBalance(
    toToken,
    !operatesNativeToken,
  )

  useEffect(
    function refetchBalances() {
      if (!['error', 'success'].includes(status)) {
        return undefined
      }
      // Native token balance in "From" should always reload
      refetchFromNativeToken()

      if (operatesNativeToken) {
        refetchToToken()
      } else {
        refetchFromTokenBalance()
        refetchToTokenBalance()
      }
      return undefined
    },
    [
      operatesNativeToken,
      refetchFromNativeToken,
      refetchFromTokenBalance,
      refetchToToken,
      refetchToTokenBalance,
      status,
    ],
  )
}
