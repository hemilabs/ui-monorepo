import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { isAddress, parseEther, toHex, type Address, type Hex } from 'viem'

import { loadArtifact } from './artifacts.ts'
import { scriptArgs } from './cli.ts'
import {
  DEFAULT_DEPLOYER_PK,
  DEFAULT_FORK_URL,
  GATEWAY_PROD,
} from './constants.ts'
import { anvilRpc, buildClients } from './rpcClients.ts'

export async function fundAccount({
  address,
  cbBtc,
  deployerPk = DEFAULT_DEPLOYER_PK,
  forkUrl = DEFAULT_FORK_URL,
  hemiBTC,
  wbtc,
}: {
  address: Address
  cbBtc?: Address
  deployerPk?: Hex
  forkUrl?: string
  hemiBTC: Address
  wbtc?: Address
}) {
  const { publicClient, walletClient } = await buildClients({
    deployerPk,
    forkUrl,
  })
  const account = walletClient.account!
  const erc20Mock = loadArtifact('LabeledERC20Mock')

  console.log('\nFunding:')

  await anvilRpc({
    forkUrl,
    method: 'anvil_setBalance',
    params: [address, toHex(parseEther('100'))],
  })
  console.log(`  ✓ anvil_setBalance ${address} → 100 ETH`)

  const mints: [string, Address, Address, bigint][] = [
    ['hemiBTC (user)', hemiBTC, address, parseEther('10')],
    ['hemiBTC (gateway liquidity)', hemiBTC, GATEWAY_PROD, parseEther('100')],
  ]
  if (wbtc) mints.push(['WBTC (user)', wbtc, address, parseEther('10')])
  if (cbBtc) mints.push(['cbBTC (user)', cbBtc, address, parseEther('10')])

  for (const [label, token, to, amount] of mints) {
    const hash = await walletClient.writeContract({
      abi: erc20Mock.abi,
      account,
      address: token,
      args: [to, amount],
      chain: walletClient.chain,
      functionName: 'mint',
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') {
      throw new Error(`mint ${label} reverted (tx ${hash})`)
    }
    console.log(`  ✓ mint ${label}`)
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    args: scriptArgs(),
    options: {
      'address': { short: 'a', type: 'string' },
      'cbbtc': { type: 'string' },
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
      'hemibtc': { type: 'string' },
      'wbtc': { type: 'string' },
    },
    strict: true,
  })

  if (!values.address || !isAddress(values.address, { strict: false })) {
    console.error(
      'Usage: node fundAccount.ts --address 0x... --hemibtc 0x... [--wbtc 0x...] [--cbbtc 0x...] [-f forkUrl]',
    )
    process.exit(1)
  }
  if (!values.hemibtc || !isAddress(values.hemibtc, { strict: false })) {
    console.error('Missing or invalid --hemibtc address')
    process.exit(1)
  }

  await fundAccount({
    address: values.address as Address,
    cbBtc: values.cbbtc as Address | undefined,
    deployerPk: (values['deployer-pk'] as Hex | undefined) ?? undefined,
    forkUrl: values['fork-url'],
    hemiBTC: values.hemibtc as Address,
    wbtc: values.wbtc as Address | undefined,
  })
}
