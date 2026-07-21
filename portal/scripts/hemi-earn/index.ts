import { scriptArgs } from './cli.ts'
import { runRelayer } from './relayer.ts'
import { runSetIntervalMining } from './setIntervalMining.ts'
import { runSetup } from './setup.ts'

const HANDLERS = {
  mining: runSetIntervalMining,
  relayer: runRelayer,
  setup: runSetup,
} as const

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- <subcommand> [flags]',
  )
  console.error(`Subcommands: ${Object.keys(HANDLERS).join(', ')}`)
}

const [subcommand, ...rest] = scriptArgs()
const handler = HANDLERS[subcommand as keyof typeof HANDLERS]

if (!handler) {
  printUsage()
  process.exit(1)
}

try {
  await handler(rest)
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n✗ sandbox:hemi-earn ${subcommand}: ${message}`)
  if (subcommand === 'setup') {
    console.error(
      '  The anvil fork may be in a partial state. Restart anvil and re-run.',
    )
  }
  process.exit(1)
}
