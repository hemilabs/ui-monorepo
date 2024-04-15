'use client'

import { Slot } from '@radix-ui/react-slot'
import { clsx } from 'clsx'
import { TransitionColorDurationMs } from 'types/transitionColorDurationMs'

interface TextProps {
  asChild?: boolean
  size?: '12' | '14' | '16' | '18'
  children: React.ReactNode
  transitionColorDurationMs?: TransitionColorDurationMs
  className?: string
}

export function Text({
  size = '14',
  children,
  asChild,
  transitionColorDurationMs = '0',
  className,
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
          'text-base': size === '16',
          'text-lg': size === '18',
          'text-sm': size === '14',
          'text-xs': size === '12',
        },
        className,
      )}
    >
      {children}
    </Comp>
  )
}
