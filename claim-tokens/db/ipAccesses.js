'use strict'

const pTap = require('p-tap')

const { logger } = require('../logger')

const tableName = 'ip_accesses'

/**
 *
 * @param {import('knex').Knex} db Knex's db or transaction instance
 * @returns {object}
 */
const createIpRepository = function (db) {
  /**
   * Checks if an IP address has been recently used
   *
   * @param {string} ip
   * @returns {Promise<boolean>}
   */
  const isIpRecentlyUsed = function (ip) {
    logger.debug('Checking if IP address has been used recently')
    return db
      .from(tableName)
      .where('ip', ip)
      .first()
      .then(row => row !== undefined)
      .then(
        pTap(function (isUsed) {
          logger.verbose(
            'IP address %s been used recently',
            isUsed ? 'has' : 'has not',
          )
        }),
      )
  }

  /**
   * Saves an IP address
   * @param {string} ip
   * @returns {Promise<void>}
   */
  const saveIp = function (ip) {
    logger.debug('Saving IP address')
    return db
      .from(tableName)
      .returning('id')
      .insert({ ip })
      .then(function ([{ id }]) {
        logger.verbose('IP address saved with id %s', id)
      })
  }

  return {
    isIpRecentlyUsed,
    saveIp,
  }
}

module.exports = { createIpRepository }
