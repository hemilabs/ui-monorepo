'use strict'

const pTap = require('p-tap')
const snakeCaseKeys = require('snakecase-keys')

const { logger } = require('../logger')
const { hashIp } = require('./utils')

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
   * Removes all email submissions
   * @returns {Promise<void>}
   */
  const removeAllEmails = function () {
    logger.debug('Removing all emails')
    return db
      .from(tableName)
      .delete()
      .then(function () {
        logger.verbose('All Emails removed')
      })
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
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.ip
   * @param {string} params.requestId
   * @param {string} params.submittedAt
   *
   */
  const saveEmail = function ({ email, ip, requestId, submittedAt }) {
    logger.debug('Saving email')
    const hashedIp = hashIp(ip)
    return db
      .from(tableName)
      .returning('id')
      .insert(snakeCaseKeys({ email, ip: hashedIp, requestId, submittedAt }))
      .then(([row]) => row)
      .then(
        pTap(function ({ id }) {
          logger.verbose('Email saved with id %s', id)
        }),
      )
  }

  return {
    isEmailSubmitted,
    removeAllEmails,
    removeEmailById,
    saveEmail,
  }
}

module.exports = { createEmailRepository }
