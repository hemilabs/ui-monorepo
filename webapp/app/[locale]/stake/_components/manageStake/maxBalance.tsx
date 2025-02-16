import { MaxButton, SetMaxEvmBalance } from 'components/setMaxBalance'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { ComponentProps } from 'react'
import { StakeToken } from 'types/stake'
import { isNativeToken } from 'utils/nativeToken'
import { formatUnits } from 'viem'

import { useStakedBalance } from '../../_hooks/useStakedBalance'

type Props = Omit<ComponentProps<typeof SetMaxEvmBalance>, 'gas'> & {
  token: StakeToken
}

export const StakeMaxBalance = function (props: Props) {
  const hemi = useHemi()
  // we really only need to exclude fees for native tokens from the "max" option
  const estimateFees = useEstimateFees({
    chainId: hemi.id,
    enabled: isNativeToken(props.token),
    operation: 'stake',
  })
  return <SetMaxEvmBalance {...props} gas={estimateFees} />
}

export const UnstakeMaxBalance = function ({
  disabled,
  onSetMaxBalance,
  token,
}: Props) {
  const { balance, isPending } = useStakedBalance(token)
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
