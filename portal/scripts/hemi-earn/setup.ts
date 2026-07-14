import { startAnvilFork } from '@hemilabs/anvil-fork-setup'
import { parseArgs } from 'node:util'
import { isAddress, type Address, type Hex } from 'viem'

import { scriptArgs } from './cli.ts'
import {
  DEFAULT_DEPLOYER_PK,
  DEFAULT_UPSTREAM_RPC,
  HEMI_CHAIN_ID,
} from './constants.ts'
import { deployMocks } from './deployMocks.ts'
import { fundAccount } from './fundAccount.ts'

const BOX_WIDTH = 78

async function main() {
  const { values } = parseArgs({
    args: scriptArgs(),
    options: {
      'address': { short: 'a', type: 'string' },
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
      'port': { short: 'p', type: 'string' },
      'upstream-rpc': { short: 'u', type: 'string' },
    },
    strict: true,
  })

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(
      'Usage: pnpm --filter hemi-earn-sandbox-scripts run setup -- --address 0xYourEOA',
    )
    console.error('  [-p PORT]              port for the fork (default 8545)')
    console.error(
      '  [-u UPSTREAM_RPC]      RPC to fork from (default Hemi mainnet)',
    )
    console.error(
      '  [-f FORK_URL]          use an anvil already running at this URL',
    )
    console.error(
      '                         (skips auto-start; --port/--upstream-rpc ignored)',
    )
    process.exit(1)
  }

  const userAddress = values.address as Address
  const deployerPk =
    (values['deployer-pk'] as Hex | undefined) ?? DEFAULT_DEPLOYER_PK

  let forkUrl: string
  if (values['fork-url']) {
    forkUrl = values['fork-url']
    console.log(`\nUsing existing anvil at ${forkUrl}`)
  } else {
    const port = values.port ? Number(values.port) : 8545
    const upstreamRpc = values['upstream-rpc'] ?? DEFAULT_UPSTREAM_RPC
    console.log(`\nStarting anvil fork of ${upstreamRpc} on port ${port}…`)
    const fork = await startAnvilFork({
      chainId: HEMI_CHAIN_ID,
      forkUrl: upstreamRpc,
      port,
    })
    forkUrl = fork.url
    // The child process is detached (unref'd) so anvil keeps running after
    // this script exits — the dev needs it alive for portal interactions.
    console.log(`  ✓ anvil pid=${fork.pid} listening at ${forkUrl}`)
  }
  console.log(`User:     ${userAddress}`)

  const deployed = await deployMocks({ deployerPk, forkUrl })

  await fundAccount({
    address: userAddress,
    cbBtc: deployed.cbBtc,
    deployerPk,
    forkUrl,
    hemiBTC: deployed.hemiBTC,
    wbtc: deployed.wbtc,
  })

  const bar = '═'.repeat(BOX_WIDTH)
  console.log(`\n╔${bar}╗`)
  console.log(`║${'  Hemi Earn sandbox ready.'.padEnd(BOX_WIDTH)}║`)
  console.log(`╠${bar}╣`)
  for (const [label, addr] of Object.entries(deployed)) {
    const line = `  ${label.padEnd(10)} ${addr}`.padEnd(BOX_WIDTH)
    console.log(`║${line}║`)
  }
  console.log(`╚${bar}╝`)

  console.log(
    '\nNote: source-level patches (constants, hooks, subgraph config, .env flags)',
  )
  console.log(
    'remain a manual per-session step until subsequent PRs cover them.',
  )
}

try {
  await main()
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n✗ Sandbox setup failed: ${message}`)
  console.error(
    '  The anvil fork may be in a partial state. Restart anvil and re-run.',
  )
  process.exit(1)
}
