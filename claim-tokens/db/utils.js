'use strict'

/**
 *
 * @param {import('knex').Knex} db
 * @returns {object}
 */
function createUtils(db) {
  const getTimestamp = () =>
    db
      .select(db.fn.now())
      .first()
      .then(({ current_timestamp: timestamp }) => timestamp)

  return {
    getTimestamp,
  }
}

module.exports = { createUtils }
