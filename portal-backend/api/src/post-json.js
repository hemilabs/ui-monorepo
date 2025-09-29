'use strict'

async function postJson(resource, payload, options = {}) {
  const res = await fetch(resource, {
    body: JSON.stringify(payload),
    method: 'POST',
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`Failed to post JSON: ${res.status} ${res.statusText}`)
  }

  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Response is not JSON')
  }

  return res.json()
}

module.exports = postJson
