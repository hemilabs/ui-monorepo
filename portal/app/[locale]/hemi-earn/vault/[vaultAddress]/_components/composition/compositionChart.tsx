'use client'

import Skeleton from 'react-loading-skeleton'
import { VictoryPie } from 'victory'

import { type CompositionItemWithColor } from './compositionColumns'

// Constants for the composition chart
const chartSize = 216
const innerRadius = 78
const padAngle = 3
const cornerRadius = 4

// Lighter versions of the composition colors for the default (no hover) state
const defaultOpacity = 0.3
const activeOpacity = 1

type Props = {
  data: CompositionItemWithColor[]
  hoveredIndex: number | null
  isPending: boolean
}

export const CompositionChart = function ({
  data,
  hoveredIndex,
  isPending,
}: Props) {
  if (data.length > 0) {
    const hoveredItem = hoveredIndex !== null ? data[hoveredIndex] : null

    return (
      <div className="shadow-bs relative flex h-full items-center justify-center rounded-lg bg-neutral-50">
        <svg
          height={chartSize}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          width={chartSize}
        >
          <VictoryPie
            colorScale={data.map(item => item.color)}
            cornerRadius={cornerRadius}
            data={data.map(item => ({ x: item.name, y: item.share }))}
            height={chartSize}
            innerRadius={innerRadius}
            labels={() => ''}
            padAngle={padAngle}
            standalone={false}
            style={{
              data: {
                opacity: ({ index }) =>
                  hoveredIndex === null
                    ? defaultOpacity
                    : index === hoveredIndex
                      ? activeOpacity
                      : defaultOpacity,
                transition: 'opacity 150ms ease-in-out',
              },
            }}
            width={chartSize}
          />
        </svg>
        {hoveredItem !== null && (
          <span className="font-inter-display text-mid-md pointer-events-none absolute font-semibold text-orange-500">
            {`${hoveredItem.share}%`}
          </span>
        )}
      </div>
    )
  }

  if (!isPending) {
    return null
  }

  return (
    <div className="shadow-bs flex h-full items-center justify-center rounded-lg bg-neutral-50 p-6">
      <Skeleton circle height={chartSize - 75} width={chartSize - 75} />
    </div>
  )
}
