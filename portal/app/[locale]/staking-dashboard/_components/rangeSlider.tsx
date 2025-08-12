type Props = {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
}

export function RangeSlider({ max, min, onChange, step, value }: Props) {
  const maxUI = min + Math.floor((max - min) / step) * step
  const uiValue = value === max ? maxUI : value

  const percentage = ((uiValue - min) / (maxUI - min)) * 100
  const background = `linear-gradient(to right, #ff6a00 0%, #ff6a00 ${percentage}%, #e5e5e5 ${percentage}%, #e5e5e5 100%)`

  function handleChange(n: number) {
    if (n >= maxUI) {
      onChange(max)
    } else {
      onChange(n)
    }
  }

  return (
    <input
      className="h-2 w-full touch-none appearance-none rounded-full focus:outline-none"
      max={maxUI}
      min={min}
      onChange={e => handleChange(Number(e.target.value))}
      step={step}
      style={{ background }}
      type="range"
      value={uiValue}
    />
  )
}
