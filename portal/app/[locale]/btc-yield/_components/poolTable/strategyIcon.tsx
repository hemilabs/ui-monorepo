import Image, { StaticImageData } from 'next/image'
import { isAddressEqual, zeroAddress } from 'viem'

import { usePoolAsset } from '../../_hooks/usePoolAsset'
import { Strategy } from '../../_types'
import { formatStrategyName } from '../../_utils'
import defaultStrategyIcon from '../images/defaultStrategy.svg'
import morphoClearstarReactorStrategyIcon from '../images/morphoClearstarReactorStrategy.svg'
import poolBufferStrategyIcon from '../images/poolBufferStrategy.svg'

// Strategy icons are matched by using the formatted name, removing spaces and in lowercase
// if not found, a default icon is shown
const icons: Record<string, StaticImageData> = {
  morphoclearstarreactor: morphoClearstarReactorStrategyIcon,
}

const getIcon = function (strategy: Strategy, poolAssetSymbol: string) {
  // handle pool buffer icon
  if (isAddressEqual(strategy.address, zeroAddress)) {
    return poolBufferStrategyIcon
  }

  const iconName = formatStrategyName(strategy.name, poolAssetSymbol)
    .toLowerCase()
    .replace(/ /g, '')

  return icons[iconName] ?? defaultStrategyIcon
}

type Props = {
  strategy: Strategy
}

export const StrategyIcon = function ({ strategy }: Props) {
  const poolAsset = usePoolAsset().data

  return (
    <Image
      alt={strategy.name}
      height={16}
      src={getIcon(strategy, poolAsset.symbol)}
      width={16}
    />
  )
}
