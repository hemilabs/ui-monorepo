'use strict'

const redis = require('redis')

const config = require('./config')
const ethCall = require('./eth-call')
const promiseAllProps = require('./promise-all-props')

const { hemi, merkleBox, safe, veHemi } = config.get('contracts')
const { correction, merkleLocked, opAddresses } = config.get('supply')
const rpcUrls = config.get('rpcUrls')

async function getTotalSupply() {
  const totalSupply = await ethCall(
    rpcUrls.eth,
    hemi.eth,
    '0x18160ddd', // totalSupply()
  )
  return BigInt(totalSupply)
}

async function getBalanceOf(rpcUrl, tokenAddress, account) {
  const balance = await ethCall(
    rpcUrl,
    tokenAddress,
    `0x70a08231${account.slice(2).padStart(64, '0')}`, // balanceOf(account)
  )
  return BigInt(balance)
}

async function getDistributedButLocked() {
  const merkleBalance = await getBalanceOf(rpcUrls.hemi, hemi.hemi, merkleBox)
  return (merkleBalance * merkleLocked) / 100n
}

const getAddressBalances = addresses =>
  addresses.reduce(function (balances, address) {
    balances[`addr-${address.slice(0, 6)}`] = getBalanceOf(
      rpcUrls.hemi,
      hemi.hemi,
      address,
    )
    return balances
  }, {})

function fetchSupply() {
  /* eslint-disable sort-keys */
  const props = {
    'total': getTotalSupply(),
    // getBalanceOnTheEmissionsDistributorContract(), // Address TBD
    'eth-safe': getBalanceOf(rpcUrls.eth, hemi.eth, safe),
    'hemi-safe': getBalanceOf(rpcUrls.hemi, hemi.hemi, safe),
    'bnb-safe': getBalanceOf(rpcUrls.bnb, hemi.bnb, safe),
    'locked': getBalanceOf(rpcUrls.hemi, hemi.hemi, veHemi),
    'merkle': getDistributedButLocked(),
    // getTokensBurned(), // Method TBD
    // getTokensSlashed(), // Method TBD
    ...getAddressBalances(opAddresses),
    'correction': Promise.resolve(correction),
  }
  /* eslint-enable sort-keys */
  return promiseAllProps(props, function (key, err) {
    console.error(`Failed to fetch supply data "${key}": ${err}`)
    return null
  })
}

const client = redis.createClient(config.get('redis'))

async function storeSupply(data) {
  try {
    await client.connect()
    await Promise.all(
      Object.entries(data)
        .map(([metric, value]) =>
          client.set(`supply:${metric}`, value.toString()),
        )
        .concat(client.set('supply:time', Date.now())),
    )
  } finally {
    await client.quit() // Release the connection to allow the process to exit
  }
}

async function refreshSupply() {
  const data = await fetchSupply()
  await storeSupply(data)
}

module.exports = {
  refreshSupply,
}
