'use strict'

const fs = require('fs')
const path = require('path')
const { getAddress } = require('viem')

/**
 * @typedef {{ amount: string, claimGroupId: number, proof: string[] }} ClaimData
 */

const inputFilePath = path.join(__dirname, 'final-claim-fix-distribution.json')
const outputFilePath = path.join(__dirname, '43111-14.json')

const data = JSON.parse(fs.readFileSync(inputFilePath, 'utf8'))

const sortedEntries = Object.entries(data).sort(([, a], [, b]) =>
  Number(BigInt(b.amount) - BigInt(a.amount)),
)

const finalData = /** @type {{ [address: string]: ClaimData }} */ ({})
let totalAmount = BigInt(0)

for (const [address, props] of sortedEntries) {
  const checksumAddress = getAddress(address)
  finalData[checksumAddress] = props
  totalAmount += BigInt(props.amount)
}

fs.writeFileSync(outputFilePath, JSON.stringify(finalData, null, 2))

console.log(`Total amount: ${totalAmount.toString()}`)
