'use client'

import { Slot } from '@radix-ui/react-slot'
import { clsx } from 'clsx'
import { ColorType } from 'types/colortype'
import { TransitionColorDurationMs } from 'types/transitionColorDurationMs'

interface TextProps {
  asChild?: boolean
  color: ColorType
  size?: '12' | '14' | '16' | '18'
  children: React.ReactNode
  transitionColorDurationMs?: TransitionColorDurationMs
}

export function Text({
  color = 'gray-5',
  size = '14',
  children,
  asChild,
  transitionColorDurationMs = '0',
}: TextProps) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      className={clsx(
        {
          'transition-colors duration-300': transitionColorDurationMs === '250',
          'transition-colors duration-500': transitionColorDurationMs === '500',
        },
        {
          'text-gray-3': color === 'gray-3',
          'text-gray-5': color === 'gray-5',
          'text-gray-9': color === 'gray-9',
          'text-orange-1': color === 'orange-1',
        },
        {
          'text-base': size === '16',
          'text-lg': size === '18',
          'text-sm': size === '14',
          'text-xs': size === '12',
        },
      )}
    >
      {children}
    </Comp>
  )
}
