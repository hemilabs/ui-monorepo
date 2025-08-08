import joi from 'utils/notJoi'

const schema = joi.number().positive().unsafe()

export const sanitizeAmount = function (input: string) {
  // If the user cleared the input, just set it to "0".
  if (!input) {
    return { value: '0' }
  }
  // Verify the input can be parsed as a valid number.
  const { error, value } = schema.validate(input)
  if (error) {
    return { error }
  }

  const _value = input
    // Remove any leading zeroes to address cases like "01", that must be
    // converted to "1".
    .replace(/^0+/, '')
    // Remove any empty spaces at the beginning or end of the input
    .trim()
  // if input ends with a dot, add a zero so it is a valid number.
  if (_value.startsWith('.')) {
    return { value: `0${_value}` }
  }
  // Input may be "0", "00", "000..." or any combination, but all are equal to 0.
  // So just return "0" in that case
  if (value === 0) {
    return { value: '0' }
  }
  return { value: _value }
}

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

  const _cleaned = input.replace(/^0+/, '').trim()

  let num = Math.abs(Number.parseFloat(_cleaned))

  // If the input is not a valid number, return the current value.
  if (!Number.isFinite(num)) {
    return { value }
  }

  // If the input is a decimal, round it to the nearest integer.
  num = Math.floor(num)

  // 1460 days (4 years) is the maximum.
  if (num > 1460) num = 1460

  return { value: String(num) }
}
