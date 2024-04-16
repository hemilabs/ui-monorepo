'use client'

import { clsx } from 'clsx'
import React from 'react'
import { TransitionColorDurationMs } from 'types/transitionColorDurationMs'

interface IconFactoryProps {
  size?: '12' | '14' | '16' | '18' | '20' | '22'
  transitionColorDurationMs?: TransitionColorDurationMs
  className?: string
}

interface PathProps {
  d: string
  fill?: boolean
  stroke?: boolean
  strokeWidth?: string
}

export const iconFactory = function (
  paths: PathProps[],
  displayName: string,
): React.FC<IconFactoryProps> {
  const Component: React.FC<IconFactoryProps> = ({
    size = '18',
    transitionColorDurationMs = '0',
    className,
  }) => (
    <svg
      className={clsx(
        {
          'transition-colors duration-300': transitionColorDurationMs === '250',
          'transition-colors duration-500': transitionColorDurationMs === '500',
        },
        {
          'text-base': size === '16',
          'text-lg': size === '18',
          'text-sm': size === '14',
          'text-xs': size === '12',
        },
        className,
      )}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      {paths.map((path, index) => (
        <path
          clipRule="evenodd"
          d={path.d}
          fill={path.fill ? 'currentColor' : 'none'}
          fillRule="evenodd"
          key={index}
          stroke={path.stroke ? 'currentColor' : 'none'}
          strokeLinecap="square"
          strokeWidth={path.strokeWidth || '1.5'}
        />
      ))}
    </svg>
  )

  Component.displayName = displayName

  return Component
}
