import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { scriptArgs } from './cli.ts'
import { DEFAULT_FORK_URL, DEFAULT_INTERVAL_MINING_SECS } from './constants.ts'
import { anvilRpc } from './rpcClients.ts'

async function setIntervalMining({
  forkUrl = DEFAULT_FORK_URL,
  seconds,
}: {
  forkUrl?: string
  seconds: number
}) {
  await anvilRpc({
    forkUrl,
    method: 'anvil_setIntervalMining',
    params: [seconds],
  })
  if (seconds === 0) {
    console.log('✓ Anvil mining: instant (mines on every tx)')
  } else {
    console.log(`✓ Anvil interval mining: every ${seconds}s`)
  }
}

export async function runSetIntervalMining(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      'fork-url': { short: 'f', type: 'string' },
      'seconds': { short: 's', type: 'string' },
    },
    strict: true,
  })

  const seconds =
    values.seconds !== undefined
      ? Number(values.seconds)
      : DEFAULT_INTERVAL_MINING_SECS

  if (!Number.isInteger(seconds) || seconds < 0) {
    console.error(
      'Usage: pnpm --filter portal sandbox:hemi-earn -- mining --seconds <N>',
    )
    console.error('  [-s N]                 interval in seconds (0 = instant)')
    console.error('  [-f FORK_URL]          anvil RPC (default 127.0.0.1:8545)')
    process.exit(1)
  }

  await setIntervalMining({ forkUrl: values['fork-url'], seconds })
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await runSetIntervalMining(scriptArgs())
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`\n✗ setIntervalMining failed: ${message}`)
    process.exit(1)
  }
}
