'use client'

import { Card } from 'components/card'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { type Address, type Chain } from 'viem'

import { CompositionIcon } from '../../../../_icons/compositionIcon'
import {
  type CompositionViewMode,
  useComposition,
} from '../../_hooks/useComposition'
import { SegmentedControlItem } from '../segmentedControlItem'

import { CompositionChart } from './compositionChart'
import { CompositionTable } from './compositionTable'

// Orange palette (dark to light); items beyond the palette wrap around
const compositionColors = [
  '#CC2F02', // orange-700
  '#FF4600', // orange-600
  '#FF600A', // orange-500
  '#FF8332', // orange-400
  '#FFB06D', // orange-300
  '#FFD1A5', // orange-200
  '#FFEAD3', // orange-100
  '#FFF6EC', // orange-50
]

type Props = {
  chainId: Chain['id']
  shareAddress: Address
}

export const Composition = function ({ chainId, shareAddress }: Props) {
  const t = useTranslations('hemi-earn.pool.composition')
  const [viewMode, setViewMode] = useState<CompositionViewMode>('token')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const { data, isError, isPending } = useComposition({
    chainId,
    shareAddress,
    viewMode,
  })

  const dataWithColors = useMemo(
    () =>
      (data ?? []).map((item, index) => ({
        ...item,
        color: compositionColors[index % compositionColors.length],
      })),
    [data],
  )

  const renderHeadline = function () {
    if (dataWithColors.length > 0) {
      // The reserve buffer row is not a position, so keep it out of the count
      const count = dataWithColors.filter(item => !item.isReserveBuffer).length
      return viewMode === 'token'
        ? t('tokens-count', { count })
        : t('protocols-count', { count })
    }
    if (isError) {
      return '-'
    }
    return <Skeleton className="h-7 w-28" />
  }

  return (
    <Card shadow="sm">
      <div className="flex w-full flex-col gap-8 p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-500">
              {t('title')}
            </span>
            <CompositionIcon />
          </div>
          <div className="flex items-center justify-between">
            <h2 className="shrink-0 text-neutral-950">{renderHeadline()}</h2>
            <div className="flex items-center gap-2">
              <SegmentedControlItem
                onClick={function () {
                  setViewMode('token')
                  setHoveredIndex(null)
                }}
                selected={viewMode === 'token'}
              >
                {t('by-token')}
              </SegmentedControlItem>
              <SegmentedControlItem
                onClick={function () {
                  setViewMode('protocol')
                  setHoveredIndex(null)
                }}
                selected={viewMode === 'protocol'}
              >
                {t('by-protocol')}
              </SegmentedControlItem>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="lg:basis-3/5">
            <CompositionTable
              data={dataWithColors}
              isPending={isPending}
              onHoveredIndexChange={setHoveredIndex}
            />
          </div>
          <div className="lg:basis-2/5">
            <CompositionChart
              data={dataWithColors}
              hoveredIndex={hoveredIndex}
              isPending={isPending}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
