/* eslint-disable camelcase */
'use strict'

const chai = require('chai')
const config = require('config')
// Using beta version due to nock not supporting node's native fetch in the latest version
// eslint-disable-next-line node/no-unpublished-require
const nock = require('nock')
const { getReasonPhrase, StatusCodes } = require('http-status-codes')

const { db } = require('../db')
const { createEmailRepository } = require('../db/emailSubmissions')
const { createIpRepository } = require('../db/ipAccesses')
const { createUtils } = require('../db/utils')

chai.should()

const { post } = require('../index')

const defaultHeaders = {
  'Content-Type': 'application/json',
}
const validBody = {
  email: 'test@email.com',
  token: 'some-recaptcha-token',
}

const assertErrorResponse = function (response, expected) {
  response.should.eql({
    body: JSON.stringify({
      detail: expected.detail,
      status: expected.statusCode,
      title: getReasonPhrase(expected.statusCode),
      type: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${expected.statusCode}`,
    }),
    headers: {
      'Access-Control-Allow-Credentials': false,
      'Access-Control-Allow-Origin': config.get('marketing.url'),
    },
    statusCode: expected.statusCode,
  })
}

const nockIpQualityScore = function ({ ip, statusCode, response }) {
  nock(config.get('ipQualityScore.url'))
    .get(`/ip/${config.get('ipQualityScore.secretKey')}/${ip}`)
    .query(true)
    .reply(statusCode, response)
}

const nockReCaptcha = function ({ ip, response, statusCode, token }) {
  const body = new URLSearchParams()
  body.append('secret', config.get('recaptcha.secretKey'))
  body.append('remoteip', ip)
  body.append('response', token)

  nock(config.get('recaptcha.url'), {
    reqheaders: {
      'content-type': 'application/x-www-form-urlencoded',
    },
  })
    .post('/siteverify', body.toString())
    .reply(statusCode, response)
}

const nockIpScoreSuccessfulResponse = () => ({
  response: {
    fraud_score: 20,
    is_crawler: false,
    proxy: false,
  },
  statusCode: 200,
})

const nockRecaptchaSuccessfulResponse = () => ({
  response: {
    action: config.get('recaptcha.action'),
    score: 0.9,
    success: true,
  },
  statusCode: 200,
})

const getEvent = ({
  body,
  headers = defaultHeaders,
  sourceIp = '127.0.0.1',
}) => ({
  body,
  headers,
  requestContext: {
    identity: { sourceIp },
  },
})

describe('claim-tokens', function () {
  before(function () {
    nock.disableNetConnect()
  })

  beforeEach(function () {
    nock.cleanAll()
  })

  after(function () {
    nock.enableNetConnect()
    return db.destroy()
  })

  it('should return Unsupported Media type if the content-type request header is not defined', async function () {
    const event = getEvent({
      headers: {},
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Unsupported Media Type',
      statusCode: StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    })
  })

  it('should return Unsupported Media type if the content-type request header is not "application/json"', async function () {
    const event = getEvent({
      headers: {
        'Content-Type': 'application/xml',
      },
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Unsupported Media Type',
      statusCode: StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    })
  })

  it('should return Unprocessable Entity if the body sent is not a valid json', async function () {
    const event = getEvent({
      body: 'not-a-json',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Invalid or malformed JSON was provided',
      statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
    })
  })

  it('should return bad request if the body is missing the email', async function () {
    const event = getEvent({
      body: JSON.stringify({
        email: validBody.email,
      }),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Invalid body',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should return bad request if the body is missing the token', async function () {
    const event = getEvent({
      body: JSON.stringify({
        token: validBody.token,
      }),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Invalid body',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should return Conflict if the email has already been submitted', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })
    const emailRepository = createEmailRepository(db)
    const dbUtils = createUtils(db)

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      token: validBody.token,
      ...nockRecaptchaSuccessfulResponse(),
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    let email
    try {
      email = await emailRepository.saveEmail({
        email: validBody.email,
        ip: event.requestContext.identity.sourceIp,
        requestId: 'some-id',
        submittedAt: await dbUtils.getTimestamp(),
      })

      const response = await post(event)

      assertErrorResponse(response, {
        detail: 'Email already submitted',
        statusCode: StatusCodes.CONFLICT,
      })
    } finally {
      await emailRepository.removeEmailById(email.id)
    }
  })

  it('should throw Internal Server Error if the Recaptcha request failed', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        success: false,
      },
      statusCode: 200,
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: undefined,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  })

  it('should throw Bad Request if the Recaptcha action is incorrect', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        action: 'incorrect-action',
        score: 0.9,
        success: true,
      },
      statusCode: 200,
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Invalid action',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should throw Internal Server Error if the Recaptcha secret is invalid or incorrect', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        'action': config.get('recaptcha.action'),
        'error-codes': ['invalid-input-secret'],
        'success': true,
      },
      statusCode: 200,
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: undefined,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  })

  it('should return Bad Request if the recaptcha token is invalid', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        'action': config.get('recaptcha.action'),
        'error-codes': ['invalid-input-response'],
        'success': true,
      },
      statusCode: 200,
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Invalid token',
      statusCode: StatusCodes.BAD_REQUEST,
    })
  })

  it('should return too many requests if the Recaptcha reuses the token', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        'action': config.get('recaptcha.action'),
        'error-codes': ['timeout-or-duplicate'],
        'success': true,
      },
      statusCode: 200,
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Duplicate token',
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
    })
  })

  it('should return Forbidden if the score is below the minimum', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      response: {
        action: config.get('recaptcha.action'),
        score: 0.1,
        success: true,
      },
      token: validBody.token,
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Low score',
      statusCode: StatusCodes.FORBIDDEN,
    })
  })

  it('should return Forbidden if the IP is suspicious', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      token: validBody.token,
      ...nockRecaptchaSuccessfulResponse(),
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      response: {
        fraud_score: 90,
        is_crawler: false,
        proxy: true,
      },
      statusCode: 200,
    })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: 'Suspicious IP address',
      statusCode: StatusCodes.FORBIDDEN,
    })
  })

  it('should return Conflict if the IP has been used recently', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })
    const ipRepository = createIpRepository(db)
    const dbUtils = createUtils(db)

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      token: validBody.token,
      ...nockRecaptchaSuccessfulResponse(),
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    let ipAccess
    try {
      ipAccess = await ipRepository.saveIp(
        event.requestContext.identity.sourceIp,
        await dbUtils.getTimestamp(),
      )

      const response = await post(event)

      assertErrorResponse(response, {
        detail: 'IP address used recently',
        statusCode: StatusCodes.CONFLICT,
      })
    } finally {
      await ipRepository.removeIpById(ipAccess.id)
    }
  })

  it('should throw Internal Server Error if if failed to send the email', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })

    nockReCaptcha({
      ip: event.requestContext.identity.sourceIp,
      token: validBody.token,
      ...nockRecaptchaSuccessfulResponse(),
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    nock('https://my-email-hook.com')
      .post(
        '/email',
        body =>
          body.email === validBody.email &&
          body.ip === event.requestContext.identity.sourceIp &&
          body.timestamp !== undefined,
      )
      .reply(500, {
        status: 'error',
      })

    const response = await post(event)

    assertErrorResponse(response, {
      detail: undefined,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    })
  })

  it('should return No Content if the email was sent successfully', async function () {
    const event = getEvent({ body: JSON.stringify(validBody) })
    const ip = event.requestContext.identity.sourceIp
    const requestId = 'some-request-id'

    nockReCaptcha({
      ip,
      token: validBody.token,
      ...nockRecaptchaSuccessfulResponse(),
    })

    nockIpQualityScore({
      ip: event.requestContext.identity.sourceIp,
      ...nockIpScoreSuccessfulResponse(),
    })

    nock('https://my-email-hook.com')
      .post(
        '/email',
        body =>
          body.email === validBody.email &&
          body.ip === ip &&
          body.timestamp !== undefined,
      )
      .reply(200, {
        request_id: requestId,
        status: 'success',
      })

    const response = await post(event)

    response.statusCode.should.equal(StatusCodes.NO_CONTENT)

    // verify data's been inserted
    const [submission, access] = await Promise.all([
      db.from('email_submissions').where({ email: validBody.email }).first(),
      db.from('ip_accesses').where({ ip }).first(),
    ])

    try {
      submission.should.have.property('ip', ip)
      submission.should.have.property('request_id', requestId)
      submission.should.have.property('submitted_at')

      access.should.have.property('created_at')
    } finally {
      // empty database even if assertions fail
      await Promise.all([
        db.from('email_submissions').where({ email: submission.email }).del(),
        db.from('ip_accesses').where({ ip }).del(),
      ])
    }
  })
})
