export const sanitizeLockup = function ({
  input,
  value,
}: {
  input: string
  value: string
}) {
  if (!input) {
    return { value: '' }
  }

  let cleaned = input.replace(/^0+/, '').trim()

  if (cleaned.length > 4) {
    cleaned = cleaned.slice(0, 4)
  }

  const num = Math.abs(Number.parseFloat(cleaned))

  // If the input is not a valid number, return the current value.
  if (!Number.isFinite(num)) {
    return { value }
  }

  return { value: String(num) }
}
