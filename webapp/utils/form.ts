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

  // Remove any leading zeroes to address cases like "01", that must be
  // converted to "1".
  const _value = input.replace(/^0+/, '')
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
