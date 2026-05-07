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

// Orange gradient palette supporting up to 12 items (dark to light)
const compositionColors = [
  '#FF4600',
  '#FF570D',
  '#FF6A1A',
  '#FF7B2E',
  '#FF8C42',
  '#FF9C5E',
  '#FFB07A',
  '#FFC299',
  '#FFD4B8',
  '#FFDEC7',
  '#FFE8D6',
  '#FFF3EB',
]

type Props = {
  chainId: Chain['id']
  vaultAddress: Address
}

export const Composition = function ({ chainId, vaultAddress }: Props) {
  const t = useTranslations('hemi-earn.vault.composition')
  const [viewMode, setViewMode] = useState<CompositionViewMode>('token')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const {
    data = [],
    isError,
    isPending,
  } = useComposition({
    chainId,
    vaultAddress,
    viewMode,
  })

  const dataWithColors = useMemo(
    () =>
      data.map((item, index) => ({
        ...item,
        color: compositionColors[index % compositionColors.length],
      })),
    [data],
  )

  const renderHeadline = function () {
    if (dataWithColors.length > 0) {
      return viewMode === 'token'
        ? t('tokens-count', { count: dataWithColors.length })
        : t('protocols-count', { count: dataWithColors.length })
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
