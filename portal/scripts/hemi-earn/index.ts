import { scriptArgs } from './cli.ts'
import { runSetIntervalMining } from './setIntervalMining.ts'
import { runSetup } from './setup.ts'

const SUBCOMMANDS = ['setup', 'mining'] as const

function printUsage() {
  console.error(
    'Usage: pnpm --filter portal sandbox:hemi-earn -- <subcommand> [flags]',
  )
  console.error(`Subcommands: ${SUBCOMMANDS.join(', ')}`)
}

const [subcommand, ...rest] = scriptArgs()

try {
  switch (subcommand) {
    case 'setup':
      await runSetup(rest)
      break
    case 'mining':
      await runSetIntervalMining(rest)
      break
    default:
      printUsage()
      process.exit(1)
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n✗ sandbox:hemi-earn ${subcommand ?? ''}: ${message}`)
  if (subcommand === 'setup') {
    console.error(
      '  The anvil fork may be in a partial state. Restart anvil and re-run.',
    )
  }
  process.exit(1)
}
