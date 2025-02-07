import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { useEstimateFees } from 'hooks/useEstimateFees'
import { useHemi } from 'hooks/useHemi'
import { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof SetMaxEvmBalance>, 'gas'>

const MaxBalance = function ({
  operation,
  ...props
}: Props & {
  operation: 'stake' | 'unstake'
}) {
  const hemi = useHemi()
  const estimateFees = useEstimateFees({
    chainId: hemi.id,
    operation,
  })
  return <SetMaxEvmBalance {...props} gas={estimateFees} />
}

export const StakeMaxBalance = (props: Props) => (
  <MaxBalance {...props} operation="stake" />
)

export const UnstakeMaxBalance = (props: Props) => (
  <MaxBalance {...props} operation="unstake" />
)
