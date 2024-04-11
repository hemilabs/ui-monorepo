'use client'

import { clsx } from 'clsx'
import React from 'react'
import { ColorType } from 'types/colortype'
import { TransitionColorDurationMs } from 'types/transitionColorDurationMs'

interface NavbarIconFactoryProps {
  size?: '12' | '14' | '16' | '18' | '20' | '22'
  color: ColorType
  transitionColorDurationMs?: TransitionColorDurationMs
}

interface PathProps {
  d: string
  fill?: boolean
  stroke?: boolean
  strokeWidth?: string
}

export function navbarIconFactory(
  paths: PathProps[],
  displayName: string,
): React.FC<NavbarIconFactoryProps> {
  const Component: React.FC<NavbarIconFactoryProps> = ({
    size = '18',
    color = 'gray-3',
    transitionColorDurationMs = '0',
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
          // eslint-disable-next-line sort-keys
          'text-gray-3': color === 'gray-3',
          'text-gray-5': color === 'gray-5',
          'text-gray-9': color === 'gray-9',
          'text-orange-1': color === 'orange-1',
        },
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
