import { SetMaxEvmBalance } from 'components/setMaxBalance'
import { ComponentProps } from 'react'

import { useEstimateStakeFees } from '../../_hooks/useEstimateStakeFees'
import { useEstimateUnstakeFees } from '../../_hooks/useEstimateUnstakeFees'

type Props = Omit<ComponentProps<typeof SetMaxEvmBalance>, 'gas'>

export const StakeMaxBalance = (props: Props) => (
  <SetMaxEvmBalance {...props} gas={useEstimateStakeFees()} />
)

export const UnstakeMaxBalance = (props: Props) => (
  <SetMaxEvmBalance {...props} gas={useEstimateUnstakeFees()} />
)
