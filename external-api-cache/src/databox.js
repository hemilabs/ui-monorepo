'use strict'

const fetchJson = require('tiny-fetch-json')

const sumBy = require('./sum-by')

async function getTvl(url, sampleId) {
  const { samples } = await fetchJson(url)
  const sample = samples.find(s => s.id === sampleId)
  const sampleData = sample.sampledata.dsData[0].data
  return sampleData.reduce(
    sumBy(item => item.items[0].value),
    0,
  )
}

module.exports = {
  getTvl,
}
