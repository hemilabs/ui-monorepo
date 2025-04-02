import { useNativeTokenBalance, useTokenBalance } from 'hooks/useBalance'
import { useEffect } from 'react'
import { type EvmToken } from 'types/token'
import { isNativeToken } from 'utils/nativeToken'

type UseReloadBalances = {
  fromToken: EvmToken
  status: string | undefined
}
export const useReloadBalances = function ({
  fromToken,
  status,
}: UseReloadBalances) {
  const operatesNativeToken = isNativeToken(fromToken)

  const { refetchBalance: refetchFromNativeToken } = useNativeTokenBalance(
    fromToken.chainId,
  )
  const { refetchTokenBalance: refetchFromTokenBalance } = useTokenBalance(
    fromToken.chainId,
    fromToken.address,
  )

  useEffect(
    function refetchBalances() {
      if (status === undefined) {
        return undefined
      }
      // Native token balance in "From" should always reload
      // as fees were paid
      refetchFromNativeToken()

      if (!operatesNativeToken) {
        refetchFromTokenBalance()
      }
      return undefined
    },
    [
      operatesNativeToken,
      refetchFromNativeToken,
      refetchFromTokenBalance,
      status,
    ],
  )
}
