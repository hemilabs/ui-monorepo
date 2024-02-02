import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEffect } from 'react'
import { Token } from 'types/token'
import { isNativeToken } from 'utils/token'

type UseReloadBalances = {
  fromToken: Token
  toToken: Token
  status: string
}
export const useReloadBalances = function ({
  fromToken,
  toToken,
  status,
}: UseReloadBalances) {
  const operatesNativeToken = isNativeToken(fromToken)

  // Native token balance in "From" should always reload
  const { refetchBalance: refetchFromNativeToken } = useNativeTokenBalance(
    fromToken.chainId,
  )
  const { refetchTokenBalance: refetchFromTokenBalance } = useTokenBalance(
    fromToken,
    !operatesNativeToken,
  )

  const { refetchBalance: refetchToToken } = useNativeTokenBalance(
    toToken.chainId,
  )

  const { refetchTokenBalance: refetchToTokenBalance } = useTokenBalance(
    toToken,
    !operatesNativeToken,
  )

  useEffect(
    function refetchBalances() {
      if (['error', 'success'].includes(status)) {
        refetchFromNativeToken()
        refetchFromTokenBalance()
        refetchToToken()
        refetchToTokenBalance()
      }
    },
    [
      status,
      refetchFromNativeToken,
      refetchFromTokenBalance,
      refetchToToken,
      refetchToTokenBalance,
    ],
  )
}
