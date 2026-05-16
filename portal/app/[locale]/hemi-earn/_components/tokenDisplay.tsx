import { TokenLogo } from 'components/tokenLogo'
import { useToken } from 'hooks/useToken'
import { type ComponentProps } from 'react'
import { type Address, type Chain } from 'viem'

import { getHemiEarnToken } from '../_constants/tokens'

type Props = {
  address: string
  chainId: Chain['id']
} & Partial<ComponentProps<typeof TokenLogo>>

export const TokenDisplay = function ({
  address,
  chainId,
  ...logoProps
}: Props) {
  const localToken = getHemiEarnToken(address as Address, chainId)
  const { data: globalToken } = useToken({
    address,
    chainId,
    options: { enabled: !localToken },
  })
  const token = localToken ?? globalToken

  if (token) {
    return <TokenLogo size="small" token={token} version="L1" {...logoProps} />
  }
  return null
}
