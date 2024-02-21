'use strict'

const config = require('config')
const fetch = require('fetch-plus-plus')
const httpErrors = require('http-errors')
const { getReasonPhrase, StatusCodes } = require('http-status-codes')

const { logger } = require('./logger')

const errorResponse = ({ detail = '', status }) => ({
  body: JSON.stringify({
    detail: status >= StatusCodes.INTERNAL_SERVER_ERROR ? undefined : detail,
    status,
    title: getReasonPhrase(status),
    type: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${status}`,
  }),
  statusCode: status,
})

const successResponse = () => ({
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
const verifyIP = publicIp =>
  fetch(
    `${config.get('ipQualityScore.url')}/ip/${config.get(
      'ipQualityScore.secretKey',
    )}/${publicIp}`,
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
    logger.verbose('IP address verified correctly')
  })

const claimTokens = async function ({ body, headers, requestContext }) {
  logger.debug('Starting request to claim tokens')
  const contentType = headers?.['Content-Type'] ?? headers?.['content-type']
  if (!/^application\/(.+\+)?json($|;.+)/.test(contentType)) {
    throw new httpErrors.UnsupportedMediaType('Unsupported Media Type')
  }
  const parsedBody = parseBody(body)
  if (!parsedBody?.token) {
    logger.debug('Body sent is invalid')
    throw new httpErrors.BadRequest('Invalid body')
  }
  return Promise.all([
    verifyRecaptcha(parsedBody.token, requestContext.identity.sourceIp),
    verifyIP(requestContext.identity.sourceIp),
  ]).then(function () {
    // if no errors were thrown, it means all checks were successful. Let's proceed to send the email
    // TODO send email
    // TODO log the email+ip+timestamp
    logger.info('Email to claim tokens sent')
    return successResponse()
  })
}

const post = event =>
  claimTokens(event).catch(err =>
    errorResponse({
      detail: err?.message,
      status: err?.status ?? StatusCodes.INTERNAL_SERVER_ERROR,
    }),
  )

module.exports = { post }
