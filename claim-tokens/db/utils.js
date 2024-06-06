'use strict'

const config = require('config')
const { createHmac } = require('crypto')

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

/**
 *
 * @param {string} ip
 * @returns {string}
 */
function hashIp(ip) {
  const key = config.get('databaseHash.secretKey')
  if (!key) {
    throw new Error('HASH_SECRET_KEY is not defined')
  }
  return createHmac('sha256', key).update(ip).digest('base64')
}

module.exports = { createUtils, hashIp }
