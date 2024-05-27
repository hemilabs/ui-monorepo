'use strict'

const chai = require('chai')
// Using beta version due to nock not supporting node's native fetch in the latest version
// eslint-disable-next-line node/no-unpublished-require
const nock = require('nock')
const { StatusCodes } = require('http-status-codes')
const { db } = require('../db')
const { createEmailRepository } = require('../db/emailSubmissions')
const { createIpRepository } = require('../db/ipAccesses')
const { post } = require('../clear-tables')

chai.should()

describe('clear-tables', function () {
  before(function () {
    nock.disableNetConnect()
  })

  beforeEach(async function () {
    nock.cleanAll()
  })

  after(function () {
    nock.enableNetConnect()
  })

  it('should remove all emails and IPs and return No Content', async function () {
    const emailRepository = createEmailRepository(db)
    const ipRepository = createIpRepository(db)

    // Insert fake data to clear
    await emailRepository.saveEmail({
      email: 'test1@example.com',
      ip: '192.168.1.1',
      requestId: 'req1',
      submittedAt: new Date(),
    })
    await ipRepository.saveIp('192.168.1.1', new Date())

    const response = await post()

    // Verify the response
    response.statusCode.should.equal(StatusCodes.NO_CONTENT)

    // Verify the tables are empty
    const emails = await db('email_submissions').select()
    const ips = await db('ip_accesses').select()
    emails.should.be.empty
    ips.should.be.empty
  })
})
