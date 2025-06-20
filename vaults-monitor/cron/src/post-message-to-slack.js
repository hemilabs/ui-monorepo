'use strict'

/**
 * Sends a text notification to a specified Slack webhook.
 *
 * @param {string} message The text to post
 * @param {string} webHookUrl The Slack webhook post URL
 * @param {string} [mention] The target audience on the Slack channel, defaults to '!here'
 * @returns
 */
async function postMessageToSlack(message, webHookUrl, mention = '!here') {
  const messageText = { text: `${mention ? `<${mention}> ` : ''}${message}.` }
  const res = await fetch(webHookUrl, {
    body: JSON.stringify(messageText),
    headers: { 'content-type': 'application/json' },
    method: 'POST',
  })
  if (!res.ok) {
    throw new Error(`Failed to post to Slack: ${res.statusText}`)
  }
  return res.text()
}

module.exports = postMessageToSlack
