import { FormEvent, MouseEvent, useRef } from 'react'

type Props = {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  minLocked?: number
}

export function RangeSlider({
  max,
  min,
  minLocked,
  onChange,
  step,
  value,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const effectiveMin = minLocked ?? min
  const maxUI = effectiveMin + Math.floor((max - effectiveMin) / step) * step

  const safeValue = Math.max(value, effectiveMin)
  const uiValue = safeValue === max ? maxUI : safeValue

  // Tolerance in steps to prevent clicks near the locked area
  const clickToleranceSteps = 8

  // locked area goes from absolute min to minLocked
  const lockedPercentage = minLocked
    ? ((minLocked - min) / (max - min)) * 100
    : 0
  const valuePercentage = ((uiValue - min) / (max - min)) * 100

  const background = minLocked
    ? `linear-gradient(to right, #a3a3a3 0%, #a3a3a3 ${lockedPercentage}%, #ff6a00 ${lockedPercentage}%, #ff6a00 ${valuePercentage}%, #e5e5e5 ${valuePercentage}%, #e5e5e5 100%)`
    : `linear-gradient(to right, #ff6a00 0%, #ff6a00 ${valuePercentage}%, #e5e5e5 ${valuePercentage}%, #e5e5e5 100%)`

  function handleInput(e: FormEvent<HTMLInputElement>) {
    const input = e.target as HTMLInputElement
    const n = Number(input.value)

    if (n < effectiveMin) {
      input.value = String(effectiveMin)
      if (inputRef.current) {
        inputRef.current.value = String(effectiveMin)
      }
      onChange(effectiveMin)
      e.preventDefault()
      return
    }

    if (n >= maxUI) {
      onChange(max)
    } else {
      onChange(n)
    }
  }

  function handleMouseDown(e: MouseEvent<HTMLInputElement>) {
    const input = e.currentTarget
    const rect = input.getBoundingClientRect()
    const clickPosition = (e.clientX - rect.left) / rect.width
    const clickValue = min + clickPosition * (max - min)

    // Only prevent if clicking significantly below the current value
    if (minLocked && clickValue < minLocked - step * clickToleranceSteps) {
      // Prevent moving the thumb into the locked area
      e.preventDefault()
    }
  }

  return (
    <input
      className="h-2 w-full touch-none appearance-none rounded-full focus:outline-none"
      max={max}
      min={min}
      onInput={handleInput}
      onMouseDown={handleMouseDown}
      ref={inputRef}
      step={step}
      style={{ background }}
      type="range"
      value={uiValue}
    />
  )
}
