type Props = {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
}

export const RangeSlider = function ({
  max,
  min,
  onChange,
  step,
  value,
}: Props) {
  const percentage = ((value - min) / (max - min)) * 100
  const background = `linear-gradient(to right, #ff6a00 0%, #ff6a00 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`

  return (
    <input
      className={
        'h-2 w-full touch-none appearance-none rounded-full focus:outline-none'
      }
      max={max}
      min={min}
      onChange={e => onChange(Number(e.target.value))}
      step={step}
      style={{ background }}
      type="range"
      value={value}
    />
  )
}
