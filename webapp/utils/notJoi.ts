// Super lightweight partial re-implementation of joi.

const notJoi = {
  number() {
    const positiveFixedPointNumberRx = /^(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))$/
    return {
      // This function exists just to match joi's API
      positive() {
        // Do nothing as we are matching against `positiveFixedPointNumberRx`
        return this
      },
      // This function exists just to match joi's API
      unsafe() {
        // Do nothing as we are coercing the input to `Number` in `validate()`
        return this
      },
      validate(value: string) {
        // Coerce from string
        let _value: string | number = value.trim()
        if (!_value.match(positiveFixedPointNumberRx)) {
          return { error: 'Must be a positive number', value }
        }
        _value = Number.parseFloat(_value)
        // Validate
        if (_value === Infinity || isNaN(_value)) {
          return { error: 'Must be a finite number', value }
        }
        // Validated!
        return { value: _value }
      },
    }
  },
}

export default notJoi
