import { MaxButton, SetMaxEvmBalance } from 'components/setMaxBalance'
import { ComponentProps } from 'react'
import { StakeToken } from 'types/stake'
import { formatUnits } from 'viem'

import { useStakedBalance } from '../../_hooks/useStakedBalance'

type Props = Omit<ComponentProps<typeof SetMaxEvmBalance>, 'gas'> & {
  token: StakeToken
}

export const StakeMaxBalance = (
  props: Props & {
    estimateFees: bigint
  },
) => <SetMaxEvmBalance {...props} gas={props.estimateFees} />

export const UnstakeMaxBalance = function ({
  disabled,
  onSetMaxBalance,
  token,
}: Props) {
  const { balance = BigInt(0), isPending } = useStakedBalance(token)
  // SetMaxEvmBalance internal logic gets the token balance, but we actually need the staked balance here.
  // So that's why we're using the MaxButton directly, which has the same UI but without the
  // extra logic of SetMaxEvmBalance.
  return (
    <MaxButton
      disabled={disabled || isPending || balance <= BigInt(0)}
      onClick={() => onSetMaxBalance(formatUnits(balance, token.decimals))}
    />
  )
}
