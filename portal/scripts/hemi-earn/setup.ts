import { parseArgs } from 'node:util'
import { isAddress, type Address, type Hex } from 'viem'

import { scriptArgs } from './cli.ts'
import { DEFAULT_DEPLOYER_PK, DEFAULT_FORK_URL } from './constants.ts'
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
    },
    strict: true,
  })

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(
      'Usage: node portal/scripts/hemi-earn/setup.ts --address 0xYourEOA [-f http://127.0.0.1:8545]',
    )
    process.exit(1)
  }

  const forkUrl = values['fork-url'] ?? DEFAULT_FORK_URL
  const deployerPk =
    (values['deployer-pk'] as Hex | undefined) ?? DEFAULT_DEPLOYER_PK
  const userAddress = values.address as Address

  console.log(`\nFork URL: ${forkUrl}`)
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
