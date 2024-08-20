'use client'

import { clsx } from 'clsx'
import { TransitionColorDurationMs } from 'types/transitionColorDurationMs'

interface TextProps {
  asChild?: boolean
  size?: '12' | '14' | '16' | '18'
  children: React.ReactNode
  transitionColorDurationMs?: TransitionColorDurationMs
  className?: string
}

export const Text = ({
  size = '14',
  children,
  transitionColorDurationMs = '0',
  className,
}: TextProps) => (
  <span
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
  </span>
)
