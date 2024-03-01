'use strict'

const pTap = require('p-tap')
const snakeCaseKeys = require('snakecase-keys')

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
   * Removes an ip submission by id
   * @param {number} id
   * @returns {Promise<void>}
   */
  const removeIpById = function (id) {
    logger.debug('Removing IP id %s', id)
    return db
      .from(tableName)
      .where({ id })
      .delete()
      .then(function () {
        logger.verbose('IP id %s removed', id)
      })
  }

  /**
   * Saves an IP address
   * @param {string} ip
   * @param {string} createdAt
   * @returns {Promise<object>}
   */
  const saveIp = function (ip, createdAt) {
    logger.debug('Saving IP address')
    return db
      .from(tableName)
      .returning('id')
      .insert(snakeCaseKeys({ createdAt, ip }))
      .then(([row]) => row)
      .then(
        pTap(function ({ id }) {
          logger.verbose('IP address saved with id %s', id)
        }),
      )
  }

  return {
    isIpRecentlyUsed,
    removeIpById,
    saveIp,
  }
}

module.exports = { createIpRepository }
