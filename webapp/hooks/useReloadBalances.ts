import { useNativeTokenBalance } from 'hooks/useBalance'
import { useEffect } from 'react'
import { Token } from 'types/token'

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
  const { refetchBalance: refetchFromToken } = useNativeTokenBalance(fromToken)
  const { refetchBalance: refetchToToken } = useNativeTokenBalance(toToken)

  useEffect(
    function refetchBalances() {
      if (['error', 'success'].includes(status)) {
        refetchFromToken()
        refetchToToken()
      }
    },
    [status, refetchFromToken, refetchToToken],
  )
}
