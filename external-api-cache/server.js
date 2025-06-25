'use strict'

const express = require('not-express')
const pSwr = require('promise-swr')
const safeAsyncFn = require('safe-async-fn')

const { getTvl } = require('./src/databox')

const originsStr = process.env.ORIGINS || `http://localhost:3000`
const portStr = process.env.PORT || '3005'
const tvlDataUrl = process.env.TVL_DATA_URL
const tvlDataSampleId = Number.parseInt(process.env.TVL_DATA_SAMPLE_ID || '')
const tvlRevalidateMin = Number.parseInt(process.env.TVL_REVALIDATE_MIN || '20')

const cachedGetTvl = safeAsyncFn(
  pSwr(() => getTvl(tvlDataUrl, tvlDataSampleId), {
    revalidate: tvlRevalidateMin * 60 * 1000,
  }),
)

const app = express()
app.use(express.cors({ origin: originsStr.split(',') }))

app.get('/tvl', async function (req, res) {
  const [err, tvl] = await cachedGetTvl()
  let statusCode, response
  if (err) {
    statusCode = 500
    response = { error: err.message }
  } else {
    statusCode = 200
    response = { tvl }
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(response))
})

app.listen(Number.parseInt(portStr))
console.log(`API server listening on port ${portStr}`)
