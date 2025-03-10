/* eslint-disable sort-keys */
import React, { useId } from 'react'

type SpinnerProps = {
  size?: 'small' | 'medium' | 'large' | number
  color?: string
  className?: string
}

function Spinner({
  size = 'medium',
  color = '#FFF7F0',
  className = '',
}: SpinnerProps) {
  // IMPORTANT: We generate a unique ID for each spinner instance using React's useId() hook.
  // This ensures that when multiple spinners are used on the same page, each has its own
  // gradient definitions. Without unique IDs, all spinners would reference the same gradient,
  // which could cause rendering issues if one spinner is removed from the DOM or when spinners
  // have different colors. The unique ID prevents these conflicts by giving each spinner
  // its own isolated gradient definitions in the SVG.
  const uniqueId = useId()

  const getDimensions = function () {
    if (typeof size === 'number') {
      return size
    }

    const sizeMap = {
      small: 24,
      medium: 40,
      large: 60,
    }

    return sizeMap[size]
  }

  const dimensions = getDimensions()
  const strokeWidth = dimensions * 0.5
  const viewBoxSize = 100
  const radius = (viewBoxSize - strokeWidth) / 2
  const center = viewBoxSize / 2

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        height={dimensions}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        width={dimensions}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${uniqueId}-gradient1`}>
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-gradient2`}>
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={'#FFF7F0'} stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <g strokeWidth={strokeWidth}>
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${
              viewBoxSize - strokeWidth / 2
            } ${center}`}
            fill="none"
            stroke={`url(#${uniqueId}-gradient1)`}
          />
          <path
            d={`M ${
              viewBoxSize - strokeWidth / 2
            } ${center} A ${radius} ${radius} 0 0 1 ${
              strokeWidth / 2
            } ${center}`}
            fill="none"
            stroke={`url(#${uniqueId}-gradient2)`}
          />
          <path
            d={`M ${strokeWidth / 2} ${center} A ${radius} ${radius} 0 0 1 ${
              strokeWidth / 2
            } ${center - 2}`}
            fill="none"
            stroke={color}
            strokeLinecap="round"
          />
          <animateTransform
            attributeName="transform"
            dur="1s"
            from={`0 ${center} ${center}`}
            repeatCount="indefinite"
            to={`360 ${center} ${center}`}
            type="rotate"
          />
        </g>
      </svg>
    </div>
  )
}

export default Spinner
