'use strict'

const pTap = require('p-tap')

const { logger } = require('../logger')

const tableName = 'email_submissions'

/**
 *
 * @param {import('knex').Knex} db Knex's db or transaction instance
 * @returns {object}
 */
const createEmailRepository = function (db) {
  /**
   * Checks if an email's already been submitted previously
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  const isEmailSubmitted = function (email) {
    logger.debug('Checking if email has been submitted previously')
    return db
      .from(tableName)
      .where({ email })
      .first()
      .then(row => row !== undefined)
      .then(
        pTap(function (isSubmitted) {
          logger.verbose(
            'Email %s been previously submitted',
            isSubmitted ? 'has' : 'has not',
          )
        }),
      )
  }

  /**
   * Removes an email submission by id
   * @param {number} id
   * @returns {Promise<void>}
   */
  const removeEmailById = function (id) {
    logger.debug('Removing email id %s', id)
    return db
      .from(tableName)
      .where({ id })
      .delete()
      .then(function () {
        logger.verbose('Email id %s removed', id)
      })
  }

  /**
   * Saves an email
   * @param {string} email
   * @param {string} ip
   *
   */
  const saveEmail = function (email, ip) {
    logger.debug('Saving email')
    return db
      .from(tableName)
      .returning('id')
      .insert({ email, ip })
      .then(([row]) => row)
      .then(
        pTap(function ({ id }) {
          logger.verbose('Email saved with id %s', id)
        }),
      )
  }

  return {
    isEmailSubmitted,
    removeEmailById,
    saveEmail,
  }
}

module.exports = { createEmailRepository }
