/* eslint-disable new-cap */
/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-env browser */
/* globals NotReactDOM, NotRedux */

'use strict'

function startInterval(callback, delay) {
  callback()
  return setInterval(callback, delay)
}

async function getVaultsState() {
  try {
    const res = await fetch('https://vault.monitor.hemi-internal.com/')
    if (!res.ok) {
      throw new Error(`Could not get vaults data: ${res.statusText}`)
    }
    const data = await res.json()
    return { data }
  } catch (error) {
    return { error }
  }
}

function BitcoinKitStatus({ bitcoin, bitcoinKit }) {
  const heightDiff = bitcoinKit.height - bitcoin.height
  return `
    <div>
      BitcoinKit last header: ${bitcoinKit.height} (<span class="${
        heightDiff < -2 ? 'text-red-600' : ''
      }">${heightDiff}</span>)
    </div>
  `
}

const TunnelManagerStatus = ({ withdrawalsPaused }) => `
  <div>
    Tunnel manager withdrawals: ${
      withdrawalsPaused
        ? '<span class="text-red-600">paused</span>'
        : '<span class="text-green-600">enabled</span>'
    }
  </div>
`

/* eslint-disable sort-keys */
const VaultStatusCodes = {
  CREATED: 0,
  INITIALIZING: 1,
  LIVE: 2,
  CLOSING_INIT: 3,
  CLOSING_VERIF: 4,
  CLOSED: 5,
}
/* eslint-enable sort-keys */

const isVaultActive = vault =>
  [VaultStatusCodes.LIVE, VaultStatusCodes.CLOSING_INIT].includes(vault.status)

function VaultsSummary({ vaultsData }) {
  const activeVaultsCount = vaultsData.filter(isVaultActive).length
  return `
    <div>
      Active vaults: ${
        activeVaultsCount
          ? `${activeVaultsCount} of ${vaultsData.length}`
          : `<span class="text-red-600">NONE</span>`
      }
    </div>
  `
}

const Link = ({ children, href }) => `
  <a class="text-blue-600 cursor-pointer hover:underline visited:text-purple-600" href="${href}" target="_blank">
    ${children}
  </a>
`

const shorten = (str, prefixLength = 2) =>
  `${str.slice(0, prefixLength + 4)}...${str.slice(-4)}`

function HemiExplorerAddressLink({ address, isTestnet }) {
  const hostname = `${isTestnet ? 'testnet.' : ''}explorer.hemi.xyz`
  const href = `https://${hostname}/address/${address}`
  return Link({ children: shorten(address), href })
}

const vaultStatusColors = {
  [VaultStatusCodes.CREATED]: 'black',
  [VaultStatusCodes.INITIALIZING]: 'black',
  [VaultStatusCodes.LIVE]: 'green',
  [VaultStatusCodes.CLOSING_INIT]: 'orange',
  [VaultStatusCodes.CLOSING_VERIF]: 'gray',
  [VaultStatusCodes.CLOSED]: 'gray',
}

function VaultStatusText({ status }) {
  const text = Object.keys(VaultStatusCodes).find(
    key => VaultStatusCodes[key] === status,
  )
  return `
    <span class="text-${vaultStatusColors[status]}-600">${text}</span>
  `
}

function MempoolExplorerAddressLink({ address, isTestnet }) {
  const baseUrl = `${isTestnet ? '/testnet' : '/'}`
  const href = `https://mempool.space${baseUrl}/address/${address}`
  return Link({ children: shorten(address), href })
}

const toBtc = sats => (sats / 100000000).toFixed(8)

const VaultStatus = ({
  balanceSats,
  bitcoinCustodyAddress,
  id,
  isTestnet,
  pendingWithdrawalAmountSat,
  pendingWithdrawalCount,
  status,
  vaultAddress,
}) => `
  <div>
    Vault ${id} (${HemiExplorerAddressLink({
      address: vaultAddress,
      isTestnet,
    })}) is ${VaultStatusText({ status })}
    <div class="ml-4">
      <div>
        ${
          bitcoinCustodyAddress
            ? `Balance at ${MempoolExplorerAddressLink({
                address: bitcoinCustodyAddress,
                isTestnet,
              })}: ${toBtc(balanceSats)} BTC`
            : 'No BTC custody address set'
        }
      </div>
      <div>
        ${
          pendingWithdrawalCount
            ? `${pendingWithdrawalCount} pending withdrawal(s): ${toBtc(
                pendingWithdrawalAmountSat,
              )} BTC`
            : `No pending withdrawals`
        }
      </div>
    </div>
  </div>
`

const GeneralStatus = ({ data }) => `
  <div>
    ${BitcoinKitStatus(data.bitcoinChainData)}
    ${TunnelManagerStatus(data.tunnelManagerData)}
    ${VaultsSummary(data)}
    ${data.vaultsData
      .map((vault, id) =>
        VaultStatus({ ...vault, id, isTestnet: data.isTestnet }),
      )
      .join('')}
  </div>
`

const _Error = ({ error }) => `
  <div>
    Oops! ${error.message || ''}
  </div>
`

const App = ({ data, error }) => `
  <div class="m-2">
    ${data ? GeneralStatus({ data }) : _Error({ error })}
  </div>
`

const initialState = { error: new Error('No data') }

function appReducer(state = initialState, action) {
  switch (action.type) {
    case 'update':
      return { ...action.payload }
    default:
      return state
  }
}

const store = NotRedux.createStore(appReducer)

function render() {
  NotReactDOM.render(App(store.getState()), document.getElementById('root'))
}

store.subscribe(render)

startInterval(async function () {
  const payload = await getVaultsState()
  store.dispatch({ payload, type: 'update' })
}, 60000)
