import { TokenLogo } from 'components/tokenLogo'
import { useToken } from 'hooks/useToken'
import { type ComponentProps } from 'react'
import { type Chain } from 'viem'

type Props = {
  address: string
  chainId: Chain['id']
} & Partial<ComponentProps<typeof TokenLogo>>

export const TokenDisplay = function ({
  address,
  chainId,
  ...logoProps
}: Props) {
  const { data: token } = useToken({ address, chainId })

  if (token) {
    return <TokenLogo size="small" token={token} version="L1" {...logoProps} />
  }
  return null
}
