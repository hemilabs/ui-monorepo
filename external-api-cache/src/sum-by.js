'use strict'

const sumBy = iteratee => (acc, value) => acc + iteratee(value)

module.exports = sumBy
