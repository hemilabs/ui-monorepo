'use strict'

const pTap = require('p-tap')

const { logger } = require('../logger')

const tableName = 'ip_accesses'

const createIpRepository = function (db) {
  /**
   * Checks if an IP address has been recently used
   *
   * @param {string} ip
   * @param {number} days
   * @returns {Promise<boolean>}
   */
  const isIpRecentlyUsed = function (ip, days) {
    logger.debug(
      'Checking if IP address has been used in the last %s days',
      days,
    )
    return db
      .from(tableName)
      .where('ip', ip)
      .andWhereRaw(
        `created_at > (now() at time zone 'utc' - interval '${days} days')`,
      )
      .first()
      .then(row => row !== undefined)
      .then(
        pTap(function (isUsed) {
          logger.verbose(
            'IP address %s been previously used in the last %s days',
            isUsed ? 'has' : 'has not',
            days,
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
