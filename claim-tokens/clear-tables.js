'use strict'

const { getReasonPhrase, StatusCodes } = require('http-status-codes')

const { getTransaction } = require('./db')
const { createEmailRepository } = require('./db/emailSubmissions')
const { createIpRepository } = require('./db/ipAccesses')
const { logger } = require('./logger')

const errorResponse = function (error) {
  const { detail } = error
  if (!error.status) {
    // if status is not set, this is probably an unhandled error. Log it and return 500
    logger.warn(detail)
  }
  const { status = StatusCodes.INTERNAL_SERVER_ERROR } = error
  return {
    body: JSON.stringify({
      detail: status >= StatusCodes.INTERNAL_SERVER_ERROR ? undefined : detail,
      status,
      title: getReasonPhrase(status),
      type: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${status}`,
    }),
    statusCode: status,
  }
}

const successResponse = () => ({
  statusCode: StatusCodes.NO_CONTENT,
})

const post = function () {
  logger.debug('Starting removing all data')
  return getTransaction().then(transaction =>
    Promise.all([
      createEmailRepository(transaction).removeAllEmails(),
      createIpRepository(transaction).removeAllIps(),
    ])
      .then(() =>
        transaction.commit().finally(() => logger.verbose('All data removed')),
      )
      .then(successResponse)
      .catch(function (err) {
        transaction.rollback()
        return errorResponse({
          detail: err?.message,
          status: err?.status,
        })
      }),
  )
}

module.exports = { post }
