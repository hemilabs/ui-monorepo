'use strict'

const config = require('config')
const fetch = require('fetch-plus-plus')
const httpErrors = require('http-errors')
const { getReasonPhrase, StatusCodes } = require('http-status-codes')
const pTap = require('p-tap')

const { db, transactionProvider } = require('./db')
const { createEmailRepository } = require('./db/emailSubmissions')
const { createIpRepository } = require('./db/ipAccesses')
const { logger } = require('./logger')

const headers = {
  'Access-Control-Allow-Credentials': false,
  'Access-Control-Allow-Origin': config.get('marketing.url'),
}

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
    headers,
    statusCode: status,
  }
}

const successResponse = () => ({
  headers,
  statusCode: StatusCodes.NO_CONTENT,
})

const fetchSiteVerify = function (token, userIp) {
  const body = new URLSearchParams()
  body.append('secret', config.get('recaptcha.secretKey'))
  body.append('remoteip', userIp)
  body.append('response', token)

  logger.debug('Sending request to verify recaptcha token')
  // https://developers.google.com/recaptcha/docs/v3#site_verify_response
  return fetch(`${config.get('recaptcha.url')}/siteverify`, {
    body: body.toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    ignoreError: true,
    method: 'POST',
  })
}

const parseBody = function (body) {
  if (!body) {
    return undefined
  }
  try {
    return JSON.parse(body)
  } catch {
    throw new httpErrors.UnprocessableEntity(
      'Invalid or malformed JSON was provided',
    )
  }
}

const verifyEmail = email =>
  createEmailRepository(db)
    .isEmailSubmitted(email)
    .then(function (submitted) {
      if (submitted) {
        logger.debug('Email already submitted for claiming before')
        throw new httpErrors.Conflict('Email already submitted')
      }
    })

const verifyRecaptcha = (token, userIp) =>
  fetchSiteVerify(token, userIp).then(function (response) {
    const action = config.get('recaptcha.action')
    const errorCodes = response?.['error-codes'] ?? []

    if (!response.success) {
      logger.verbose('Recaptcha request failed', response)
      throw new httpErrors.InternalServerError('Recaptcha request failed')
    }
    if (response.action !== action) {
      logger.verbose('Expected action %s but got %s', action, response.action)
      throw new httpErrors.BadRequest('Invalid action')
    }
    // Error code reference guide https://developers.google.com/recaptcha/docs/verify#error_code_reference
    if (errorCodes.includes('invalid-input-secret')) {
      logger.warn('The recaptcha secret is invalid or incorrect')
      throw new httpErrors.InternalServerError(
        'The recaptcha secret is invalid or incorrect',
      )
    }
    if (errorCodes.includes('invalid-input-response')) {
      logger.verbose('The recaptcha token is invalid')
      throw new httpErrors.BadRequest('Invalid token')
    }
    if (errorCodes.includes('timeout-or-duplicate')) {
      logger.verbose('Recaptcha request timed out or was a duplicate')
      throw new httpErrors.TooManyRequests('Duplicate token')
    }
    if (errorCodes.includes('browser-error')) {
      // This error code is not documented!!! But it is returned if calling from a domain that
      // is not whitelisted. Logging a warn because that may could be a misconfiguration (our error)
      // or someone else's frontend calling us (not our error)
      // However, recaptcha does generate an invalid token (that's why we've reached this point), so I believe
      // returning Invalid Token is correct, even though the error may be ours.
      logger.warn(
        'The recaptcha configured domain is not whitelisted. It may be a misconfiguration',
      )
      throw new httpErrors.BadRequest('Invalid token')
    }
    if (response.score < config.get('recaptcha.minScore')) {
      logger.verbose(
        'Recaptcha returned %s, a score below the minimum',
        response.score,
      )
      throw new httpErrors.Forbidden('Low score')
    }
    logger.verbose('Recaptcha token verified correctly')
  })

// See parameters and response in https://www.ipqualityscore.com/documentation/proxy-detection-api/overview
const verifyIpQualityScore = ip =>
  fetch(
    `${config.get('ipQualityScore.url')}/ip/${config.get(
      'ipQualityScore.secretKey',
    )}/${ip}`,
    {
      queryString: {
        // eslint-disable-next-line camelcase
        allow_public_access_points: true,
        strictness: 0,
      },
    },
  ).then(function (response) {
    if (
      response.is_crawler ||
      response.proxy ||
      response.fraud_score > config.get('ipQualityScore.maxScore')
    ) {
      throw new httpErrors.Forbidden('Suspicious IP address')
    }
    logger.verbose('IP score verified correctly')
  })

const verifyIP = ip =>
  Promise.all([
    verifyIpQualityScore(ip),
    createIpRepository(db)
      .isIpRecentlyUsed(ip)
      .then(function (wasRecentlyUsed) {
        if (wasRecentlyUsed) {
          logger.debug('IP address has been used recently')
          throw new httpErrors.Conflict('IP address used recently')
        }
      }),
  ])

const saveEmailAndIP = (transaction, email, ip) =>
  Promise.all([
    createEmailRepository(transaction).saveEmail(email, ip),
    createIpRepository(transaction).saveIp(ip),
  ])

const sendEmail = email =>
  function () {
    logger.debug('Calling webhook to send email')
    return Promise.resolve(email)
  }

const submitClaimingRequest = function (email, ip) {
  logger.debug('Starting transaction to submit email and IP')
  return transactionProvider().then(transaction =>
    saveEmailAndIP(transaction, email, ip)
      .then(
        pTap(function () {
          logger.debug('Email and IP saved successfully. Sending email now')
        }),
      )
      .then(sendEmail(email))
      .then(transaction.commit)
      .then(
        pTap(function () {
          logger.verbose('Transaction committed')
        }),
      )
      .catch(
        // rollback and let the error bubble up
        pTap.catch(transaction.rollback),
      ),
  )
}

const claimTokens = async function ({
  body,
  headers: requestHeaders,
  requestContext,
}) {
  logger.debug('Starting request to claim tokens')
  const contentType =
    requestHeaders?.['Content-Type'] ?? requestHeaders?.['content-type']
  if (!/^application\/(.+\+)?json($|;.+)/.test(contentType)) {
    throw new httpErrors.UnsupportedMediaType('Unsupported Media Type')
  }
  const parsedBody = parseBody(body)
  if (!parsedBody?.token || !parsedBody?.email) {
    logger.debug('Body sent is invalid')
    throw new httpErrors.BadRequest('Invalid body')
  }
  const ip = requestContext.identity.sourceIp

  return Promise.all([
    verifyEmail(parsedBody.email),
    verifyRecaptcha(parsedBody.token, ip),
    verifyIP(ip),
  ])
    .then(() => submitClaimingRequest(parsedBody.email, ip))
    .then(function () {
      logger.info('Email to claim tokens sent')
    })
}

const post = event =>
  claimTokens(event)
    .then(successResponse)
    .catch(
      pTap.catch(function (err) {
        logger.debug('Failed to submit claim request: %s', err.message)
      }),
    )
    .catch(err =>
      errorResponse({
        detail: err?.message,
        status: err?.status,
      }),
    )

module.exports = { post }
