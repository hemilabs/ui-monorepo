'use strict'
const { logger } = require('./logger')

async function post({ body }) {
  logger.debug('Fake-sending email to %s', JSON.parse(body).email)
  return {
    body: JSON.stringify({
      // eslint-disable-next-line camelcase
      request_id: '018dfa7d-a119-555f-0b3b-85eebe5ceaa3',
      status: 'success',
    }),
    statusCode: 200,
  }
}

module.exports = {
  post,
}
