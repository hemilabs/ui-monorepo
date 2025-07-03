'use strict'

/**
 * Creates a reducer function that sums values returned by the iteratee.
 *
 * Inspired by the FP version of lodash.sumBy but without all the boilerplate.
 *
 * @template T
 * @param {(item: T) => number} iteratee - Function to extract the value to sum from each item.
 * @returns {(acc: number, value: T) => number} Reducer function for Array.prototype.reduce.
 */
const sumBy = iteratee => (acc, value) => acc + iteratee(value)

module.exports = sumBy
