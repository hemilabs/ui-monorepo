import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { type Abi, type Address, type Hex } from 'viem'

import { loadArtifact } from './artifacts.ts'
import { scriptArgs } from './cli.ts'
import {
  DEFAULT_DEPLOYER_PK,
  DEFAULT_FORK_URL,
  GATEWAY_PROD,
  STAKING_PROD,
  VETBTC_PROD,
} from './constants.ts'
import { anvilRpc, buildClients } from './rpcClients.ts'

export type DeployedMocks = {
  agent: Address
  cbBtc: Address
  gateway: Address
  hemiBTC: Address
  router: Address
  staking: Address
  vetBTC: Address
  wbtc: Address
}

export async function deployMocks({
  deployerPk = DEFAULT_DEPLOYER_PK,
  forkUrl = DEFAULT_FORK_URL,
}: {
  deployerPk?: Hex
  forkUrl?: string
}): Promise<DeployedMocks> {
  const { publicClient, walletClient } = await buildClients({
    deployerPk,
    forkUrl,
  })
  const account = walletClient.account!

  async function deploy(params: {
    args?: readonly unknown[]
    artifact: { abi: Abi; bytecode: Hex }
    label: string
  }) {
    const hash = await walletClient.deployContract({
      abi: params.artifact.abi,
      account,
      args: (params.args ?? []) as never,
      bytecode: params.artifact.bytecode,
      chain: walletClient.chain,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') {
      throw new Error(`${params.label} deploy reverted (tx ${hash})`)
    }
    if (!receipt.contractAddress) {
      throw new Error(`${params.label} deploy did not return an address`)
    }
    return receipt.contractAddress
  }

  async function writeAndWait(params: {
    abi: Abi
    address: Address
    args: readonly unknown[]
    functionName: string
    label: string
  }) {
    const hash = await walletClient.writeContract({
      abi: params.abi,
      account,
      address: params.address,
      args: params.args as never,
      chain: walletClient.chain,
      functionName: params.functionName as never,
    })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    if (receipt.status !== 'success') {
      throw new Error(`${params.label} reverted (tx ${hash})`)
    }
    console.log(`  ✓ ${params.label}`)
  }

  // Deploy a mock locally so its constructor runs and any immutables are
  // baked into the runtime code, then anvil_setCode that runtime at the
  // target production address. Storage at the target starts empty —
  // callers re-apply storage-backed state via setters afterwards.
  async function aliasCode(params: {
    artifact: { abi: Abi; bytecode: Hex }
    ctorArgs?: readonly unknown[]
    label: string
    prod: Address
  }) {
    const tempAddr = await deploy({
      args: params.ctorArgs,
      artifact: params.artifact,
      label: `${params.label} (temp)`,
    })
    const runtime = await publicClient.getBytecode({ address: tempAddr })
    // getBytecode returns undefined for no-code addresses and '0x' for an
    // empty runtime — treat both as "no code to alias".
    if (!runtime || runtime === '0x') {
      throw new Error(`No runtime code at ${tempAddr} for ${params.label}`)
    }
    await anvilRpc({
      forkUrl,
      method: 'anvil_setCode',
      params: [params.prod, runtime],
    })
    console.log(`  ✓ setCode  ${params.label.padEnd(10)} @ ${params.prod}`)
  }

  const erc20Mock = loadArtifact('LabeledERC20Mock')
  const peggedTokenMock = loadArtifact('PeggedTokenMock')
  const gatewayMock = loadArtifact('PreviewableGatewayMock')
  const stakingVaultMock = loadArtifact('CooldownAwareStakingVaultMock')
  const routerMock = loadArtifact('ToggleableRouter')
  const agentMock = loadArtifact('ToggleableAgent')

  console.log('\nPhase 1 — Hemi-side asset:')
  const hemiBTC = await deploy({ artifact: erc20Mock, label: 'hemiBTC' })
  console.log(`  hemiBTC    ${hemiBTC}`)
  await writeAndWait({
    abi: erc20Mock.abi,
    address: hemiBTC,
    args: ['Hemi BTC', 'hemiBTC'],
    functionName: 'setLabel',
    label: 'hemiBTC.setLabel',
  })

  console.log('\nPhase 2 — anvil_setCode Vetro mocks at production addresses:')
  await aliasCode({
    artifact: peggedTokenMock,
    label: 'vetBTC',
    prod: VETBTC_PROD,
  })
  await aliasCode({
    artifact: gatewayMock,
    ctorArgs: [VETBTC_PROD],
    label: 'Gateway',
    prod: GATEWAY_PROD,
  })
  // ERC4626Mock's constructor reads asset_.decimals(), so the pegged-token
  // alias must exist before the staking mock deploys.
  await aliasCode({
    artifact: stakingVaultMock,
    ctorArgs: [VETBTC_PROD],
    label: 'Staking',
    prod: STAKING_PROD,
  })

  console.log('\nPhase 3 — wire state at aliased addresses:')
  await writeAndWait({
    abi: peggedTokenMock.abi,
    address: VETBTC_PROD,
    args: [GATEWAY_PROD],
    functionName: 'setGateway',
    label: 'vetBTC.setGateway(GATEWAY_PROD)',
  })
  await writeAndWait({
    abi: gatewayMock.abi,
    address: GATEWAY_PROD,
    args: [10_000n],
    functionName: 'setDepositRateBps',
    label: 'Gateway.setDepositRateBps(10000)',
  })
  await writeAndWait({
    abi: gatewayMock.abi,
    address: GATEWAY_PROD,
    args: [10_000n],
    functionName: 'setRedeemRateBps',
    label: 'Gateway.setRedeemRateBps(10000)',
  })

  console.log('\nPhase 4 — Router + Agent (local, share=STAKING_PROD):')
  const agent = await deploy({
    args: [hemiBTC, STAKING_PROD],
    artifact: agentMock,
    label: 'Agent',
  })
  console.log(`  Agent      ${agent}`)
  const router = await deploy({
    args: [hemiBTC, STAKING_PROD],
    artifact: routerMock,
    label: 'Router',
  })
  console.log(`  Router     ${router}`)

  console.log('\nWiring router ↔ agent peers:')
  await writeAndWait({
    abi: routerMock.abi,
    address: router,
    args: [agent],
    functionName: 'setPeer',
    label: 'router.setPeer(agent)',
  })
  await writeAndWait({
    abi: agentMock.abi,
    address: agent,
    args: [router],
    functionName: 'setPeer',
    label: 'agent.setPeer(router)',
  })

  console.log('\nPhase 5 — extra UI-only assets:')
  const wbtc = await deploy({ artifact: erc20Mock, label: 'WBTC' })
  console.log(`  WBTC       ${wbtc}`)
  await writeAndWait({
    abi: erc20Mock.abi,
    address: wbtc,
    args: ['Wrapped BTC', 'WBTC'],
    functionName: 'setLabel',
    label: 'WBTC.setLabel',
  })
  const cbBtc = await deploy({ artifact: erc20Mock, label: 'cbBTC' })
  console.log(`  cbBTC      ${cbBtc}`)
  await writeAndWait({
    abi: erc20Mock.abi,
    address: cbBtc,
    args: ['Coinbase Wrapped BTC', 'cbBTC'],
    functionName: 'setLabel',
    label: 'cbBTC.setLabel',
  })

  // Portal's dynamic asset registry reads AssetDataUpdated logs.
  console.log('\nPhase 6 — register assets on router:')
  for (const [name, addr] of [
    ['hemiBTC', hemiBTC],
    ['WBTC', wbtc],
    ['cbBTC', cbBtc],
  ] as const) {
    await writeAndWait({
      abi: routerMock.abi,
      address: router,
      args: [addr, STAKING_PROD, addr, STAKING_PROD, true],
      functionName: 'updateAssetData',
      label: `router.updateAssetData(${name})`,
    })
  }

  console.log('\nPhase 7 — enable cooldown (1 day):')
  await writeAndWait({
    abi: stakingVaultMock.abi,
    address: STAKING_PROD,
    args: [true],
    functionName: 'updateCooldownEnabled',
    label: 'staking.updateCooldownEnabled(true)',
  })
  await writeAndWait({
    abi: stakingVaultMock.abi,
    address: STAKING_PROD,
    args: [86_400n],
    functionName: 'updateCooldownDuration',
    label: 'staking.updateCooldownDuration(86400)',
  })

  return {
    agent,
    cbBtc,
    gateway: GATEWAY_PROD,
    hemiBTC,
    router,
    staking: STAKING_PROD,
    vetBTC: VETBTC_PROD,
    wbtc,
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { values } = parseArgs({
    args: scriptArgs(),
    options: {
      'deployer-pk': { type: 'string' },
      'fork-url': { short: 'f', type: 'string' },
    },
    strict: true,
  })
  const deployed = await deployMocks({
    deployerPk: (values['deployer-pk'] as Hex | undefined) ?? undefined,
    forkUrl: values['fork-url'],
  })
  console.log('\nDeployed addresses:')
  for (const [key, addr] of Object.entries(deployed)) {
    console.log(`  ${key.padEnd(10)} ${addr}`)
  }
}
