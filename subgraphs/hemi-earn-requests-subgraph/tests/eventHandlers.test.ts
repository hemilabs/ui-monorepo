import { createTestIndexer, TestHelpers } from 'envio'
import type { TestIndexerProcessConfig } from 'envio'
import { beforeEach, describe, expect, it } from 'vitest'

// side-effect: register the onEvent handlers
import '../src/mappings/eventHandlers'

const { mockAddresses } = TestHelpers.Addresses

// Chain ids and start blocks mirror config.yaml. Simulated block.number must be
// >= the chain's start_block.
const HEMI = 43111
const ETH = 1
const HEMI_START = 4_539_427 // Router deploy block on Hemi
const ETH_START = 25_224_437 // Agent deploy block on Ethereum

const ASSET = mockAddresses[0]
const RECEIVER = mockAddresses[1]
const SENDER = mockAddresses[2]
const SHARE = mockAddresses[3]
const zeroAddress = '0x0000000000000000000000000000000000000000'
const ROUTER = '0x8a23df259c6798f9eacc51ae816461218c3acddc'

let ti: ReturnType<typeof createTestIndexer>
beforeEach(() => {
  // A fresh indexer per test gives isolated in-memory entity state.
  ti = createTestIndexer()
})

// A simulated event for one chain, fully typed against the project's config
// (contract/event/params keep their per-event types).
type SimEvent = NonNullable<
  NonNullable<TestIndexerProcessConfig['chains'][typeof HEMI]>['simulate']
>[number]

// Process one chain's events — collapses the
// `process({ chains: { [id]: { simulate } } })` nesting that otherwise repeats
// in every test.
const onChain = (chain: typeof HEMI | typeof ETH, simulate: SimEvent[]) =>
  ti.process({ chains: { [chain]: { simulate } } })

describe('Router request creation', () => {
  it('DepositRequested creates a PENDING deposit with lowercased addresses', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'DepositRequested',
        params: {
          amountOutMin: 900n,
          asset: ASSET,
          assets: 1000n,
          automatic: false,
          receiver: RECEIVER,
          requestId: 1n,
        },
        transaction: { from: SENDER, hash: '0xdep' },
      },
    ])

    const req = await ti.Request.getOrThrow('1')
    expect(req.kind).toBe('DEPOSIT')
    expect(req.status).toBe('PENDING')
    // deposit input = assets
    expect(req.amountIn).toBe(1000n)
    expect(req.amountOutMin).toBe(900n)
    expect(req.automatic).toBe(false)
    expect(req.asset).toBe(ASSET.toLowerCase())
    expect(req.receiver).toBe(RECEIVER.toLowerCase())
    expect(req.initiator).toBe(SENDER.toLowerCase())
    expect(req.requestedAt).toBe(1_700_000_000n)
    expect(req.requestTxHash).toBe('0xdep')
  })

  it('RedeemRequested creates a PENDING redeem with amountIn = shares', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RedeemRequested',
        params: {
          amountOutMin: 0n,
          asset: ASSET,
          automatic: true,
          receiver: RECEIVER,
          requestId: 2n,
          shares: 500n,
        },
        transaction: { from: SENDER, hash: '0xred' },
      },
    ])

    const req = await ti.Request.getOrThrow('2')
    expect(req.kind).toBe('REDEEM')
    expect(req.status).toBe('PENDING')
    // redeem input = shares
    expect(req.amountIn).toBe(500n)
    expect(req.automatic).toBe(true)
  })
})

describe('status ranking and terminal stickiness', () => {
  it('advances PENDING -> FULFILLED -> FINALIZED across ordered events', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'DepositRequested',
        params: {
          amountOutMin: 0n,
          asset: ASSET,
          assets: 1000n,
          automatic: false,
          receiver: RECEIVER,
          requestId: 10n,
        },
      },
      {
        block: { number: HEMI_START + 1, timestamp: 1_700_000_100 },
        contract: 'Router',
        event: 'RequestFulfilled',
        params: { amount: 990n, requestId: 10n },
      },
      {
        block: { number: HEMI_START + 2, timestamp: 1_700_000_200 },
        contract: 'Router',
        event: 'RequestClaimed',
        params: { requestId: 10n },
        transaction: { from: SENDER, hash: '0xclaim' },
      },
    ])

    const req = await ti.Request.getOrThrow('10')
    expect(req.status).toBe('FINALIZED')
    // set by RequestFulfilled
    expect(req.amountOut).toBe(990n)
    expect(req.claimTxHash).toBe('0xclaim')
  })

  it('does not regress a terminal status when a lower-rank event arrives later', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RequestCancelled',
        params: { amount: 1000n, requestId: 11n },
      },
      {
        block: { number: HEMI_START + 1, timestamp: 1_700_000_100 },
        contract: 'Router',
        event: 'RequestFulfilled',
        params: { amount: 990n, requestId: 11n },
      },
    ])

    const req = await ti.Request.getOrThrow('11')
    // terminal status
    expect(req.status).toBe('CANCELLED')
    expect(req.cancelledAmount).toBe(1000n)
  })
})

describe('cross-chain partial view', () => {
  it('merges Agent (Ethereum) and Router (Hemi) events into one Request', async () => {
    // Two chains in one call, so this keeps the raw `process` shape.
    await ti.process({
      chains: {
        [ETH]: {
          simulate: [
            {
              block: { number: ETH_START, timestamp: 1_700_000_050 },
              contract: 'Agent',
              event: 'DepositRequestProcessed',
              logIndex: 0,
              params: {
                assets: 1000n,
                requestId: 20n,
                shares: 12n,
                staked: 1000n,
              },
              transaction: { from: SENDER, hash: '0xproc' },
            },
          ],
        },
        [HEMI]: {
          simulate: [
            {
              block: { number: HEMI_START, timestamp: 1_700_000_000 },
              contract: 'Router',
              event: 'DepositRequested',
              params: {
                amountOutMin: 0n,
                asset: ASSET,
                assets: 1000n,
                automatic: false,
                receiver: RECEIVER,
                requestId: 20n,
              },
              transaction: { from: SENDER, hash: '0xreq' },
            },
          ],
        },
      },
    })

    const req = await ti.Request.getOrThrow('20')
    // Router-side fields
    expect(req.kind).toBe('DEPOSIT')
    expect(req.status).toBe('PENDING')
    expect(req.initiator).toBe(SENDER.toLowerCase())
    expect(req.requestTxHash).toBe('0xreq')
    expect(req.asset).toBe(ASSET.toLowerCase())

    // Agent-side fields
    expect(req.amountOut).toBe(12n) // deposit output (sVetToken)
    expect(req.processTxHash).toBe('0xproc')
    expect(req.processedAt).toBe(1_700_000_050n)
    expect(req.amountIn).toBe(1000n)
  })
})

describe('amountOut sources', () => {
  it('RedeemRequestProcessed (Agent) sets amountOut = assets', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'RedeemRequestProcessed',
        params: {
          assets: 480n,
          requestId: 30n,
          shares: 500n,
          unstaked: 500n,
        },
      },
    ])

    const req = await ti.Request.getOrThrow('30')
    expect(req.kind).toBe('REDEEM')
    expect(req.amountIn).toBe(500n) // redeem input echoed by the Agent
    expect(req.amountOut).toBe(480n) // redeem output
  })

  it('RequestFulfilled (Router) sets amountOut = amount', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RequestFulfilled',
        params: { amount: 480n, requestId: 31n },
      },
    ])

    const req = await ti.Request.getOrThrow('31')
    expect(req.amountOut).toBe(480n)
    expect(req.status).toBe('FULFILLED')
  })
})

describe('Agent milestones', () => {
  it('UnstakeRequested records the cooldown claimableAt', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'UnstakeRequested',
        params: { claimableAt: 1_700_604_800n, requestId: 40n },
      },
    ])

    const req = await ti.Request.getOrThrow('40')
    expect(req.claimableAt).toBe(1_700_604_800n)
  })

  it('RequestFailed then RequestRetried flips failed and bumps retryCount', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'RequestFailed',
        params: { reason: '0xdeadbeef', requestId: 41n },
      },
      {
        block: { number: ETH_START + 1, timestamp: 1_700_000_100 },
        contract: 'Agent',
        event: 'RequestRetried',
        params: { requestId: 41n },
      },
    ])

    const req = await ti.Request.getOrThrow('41')
    expect(req.failed).toBe(false) // reset by the retry
    expect(req.failureReason).toBeUndefined() // cleared by the retry
    expect(req.retryCount).toBe(1)
  })

  it('RequestFailed leaves status Router-authoritative (PENDING)', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'RequestFailed',
        params: { reason: '0xdeadbeef', requestId: 42n },
      },
    ])

    const req = await ti.Request.getOrThrow('42')
    expect(req.failed).toBe(true)
    expect(req.failureReason).toBe('0xdeadbeef')
    expect(req.status).toBe('PENDING')
  })

  it('RedeemRequestReceived fills kind/asset/amountIn without overwriting existing', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'RedeemRequestReceived',
        params: {
          asset: ASSET,
          requestId: 43n,
          share: SHARE,
          shares: 500n,
        },
      },
    ])

    const req = await ti.Request.getOrThrow('43')
    expect(req.kind).toBe('REDEEM')
    expect(req.asset).toBe(ASSET.toLowerCase())
    expect(req.amountIn).toBe(500n)
    expect(req.receivedAt).toBe(1_700_000_000n)
  })
})

describe('cancellation signals', () => {
  it('Router CancellationRequested flags intent without changing status', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'CancellationRequested',
        params: { requestId: 50n },
      },
    ])

    const req = await ti.Request.getOrThrow('50')
    expect(req.cancellationRequested).toBe(true)
    expect(req.cancellationRequestedAt).toBe(1_700_000_000n)
    expect(req.status).toBe('PENDING')
  })

  it('Agent RequestCancellationTriggered records the intent', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'RequestCancellationTriggered',
        params: { requestId: 51n },
      },
    ])

    const req = await ti.Request.getOrThrow('51')
    expect(req.cancellationRequested).toBe(true)
    expect(req.status).toBe('PENDING')
  })
})

describe('terminal lifecycle', () => {
  it('RequestRecovered marks the request RECOVERED with recoverTxHash and finalizedAt', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RequestRecovered',
        params: { requestId: 60n },
        transaction: { from: SENDER, hash: '0xrecover' },
      },
    ])

    const req = await ti.Request.getOrThrow('60')
    expect(req.status).toBe('RECOVERED')
    expect(req.recoverTxHash).toBe('0xrecover')
    expect(req.finalizedAt).toBe(1_700_000_000n)
  })

  it('RequestCancelled then RequestRecovered transitions through to RECOVERED', async () => {
    // Production on-chain path for the manual-recover flow:
    //   PENDING → (Agent.cancel) → CANCELLED → (user signs recoverDeposit) → RECOVERED
    // Both events fire in sequence at the Router; the indexer must let
    // CANCELLED transition forward to RECOVERED. Mirrors the existing
    // FULFILLED → FINALIZED progression for the happy path.
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RequestCancelled',
        params: { amount: 1000n, requestId: 62n },
      },
      {
        block: { number: HEMI_START + 1, timestamp: 1_700_000_100 },
        contract: 'Router',
        event: 'RequestRecovered',
        params: { requestId: 62n },
        transaction: { from: SENDER, hash: '0xrecover62' },
      },
    ])

    const req = await ti.Request.getOrThrow('62')
    expect(req.status).toBe('RECOVERED')
    expect(req.recoverTxHash).toBe('0xrecover62')
    expect(req.finalizedAt).toBe(1_700_000_100n)
    // Cancellation companion stays populated from the intermediate step —
    // historical record of why the recovery was needed.
    expect(req.cancelledAmount).toBe(1000n)
  })

  it('a later terminal event does not clobber the finalized request', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'Router',
        event: 'RequestClaimed',
        params: { requestId: 61n },
        transaction: { from: SENDER, hash: '0xclaim' },
      },
      {
        block: { number: HEMI_START + 1, timestamp: 1_700_000_100 },
        contract: 'Router',
        event: 'RequestCancelled',
        params: { amount: 500n, requestId: 61n },
      },
    ])

    const req = await ti.Request.getOrThrow('61')
    // The first terminal status wins and its companion fields are untouched.
    expect(req.status).toBe('FINALIZED')
    expect(req.finalizedAt).toBe(1_700_000_000n) // not the late cancel timestamp
    expect(req.cancelledAmount).toBeUndefined() // companion field not written
  })
})

describe('Agent receives', () => {
  it('DepositRequestReceived fills kind/asset/amountIn/receivedAt', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_000 },
        contract: 'Agent',
        event: 'DepositRequestReceived',
        params: { asset: ASSET, assets: 1000n, requestId: 62n },
      },
    ])

    const req = await ti.Request.getOrThrow('62')
    expect(req.kind).toBe('DEPOSIT')
    expect(req.asset).toBe(ASSET.toLowerCase())
    expect(req.amountIn).toBe(1000n)
    expect(req.receivedAt).toBe(1_700_000_000n)
  })

  it('DepositRequestProcessed does not overwrite the Router-set amountIn', async () => {
    await ti.process({
      chains: {
        [ETH]: {
          simulate: [
            {
              block: { number: ETH_START, timestamp: 1_700_000_050 },
              contract: 'Agent',
              event: 'DepositRequestProcessed',
              logIndex: 0,
              params: {
                assets: 999n, // Agent echo differs from the Router value
                requestId: 63n,
                shares: 12n,
                staked: 999n,
              },
              transaction: { from: SENDER, hash: '0xproc' },
            },
          ],
        },
        [HEMI]: {
          simulate: [
            {
              block: { number: HEMI_START, timestamp: 1_700_000_000 },
              contract: 'Router',
              event: 'DepositRequested',
              params: {
                amountOutMin: 0n,
                asset: ASSET,
                assets: 1000n, // Router-authoritative deposit input
                automatic: false,
                receiver: RECEIVER,
                requestId: 63n,
              },
            },
          ],
        },
      },
    })

    const req = await ti.Request.getOrThrow('63')
    expect(req.amountIn).toBe(1000n) // Router value kept, not clobbered to 999n
    expect(req.amountOut).toBe(12n)
    expect(req.stakedAmount).toBe(999n) // pegged staked into the vault
  })
})

describe('ShareToken transfers', () => {
  const leg = (
    hash: string,
    logIndex: number,
    from: `0x${string}`,
    to: `0x${string}`,
  ) => ({
    block: { number: HEMI_START, timestamp: 1_700_000_000 },
    contract: 'ShareToken' as const,
    event: 'Transfer' as const,
    logIndex,
    params: { from, to, value: 1n },
    srcAddress: SHARE,
    transaction: { from: SENDER, hash },
  })

  it('stores a wallet-to-wallet transfer', async () => {
    await onChain(HEMI, [
      {
        block: { number: HEMI_START, timestamp: 1_700_000_000 },
        contract: 'ShareToken',
        event: 'Transfer',
        logIndex: 5,
        params: { from: SENDER, to: RECEIVER, value: 1000n },
        srcAddress: SHARE,
        transaction: { from: SENDER, hash: '0xtransfer' },
      },
    ])

    const transfer = await ti.ShareTransfer.getOrThrow('0xtransfer-5')
    expect(transfer.from).toBe(SENDER.toLowerCase())
    expect(transfer.to).toBe(RECEIVER.toLowerCase())
    expect(transfer.value).toBe(1000n)
    expect(transfer.share).toBe(SHARE.toLowerCase())
    expect(transfer.timestamp).toBe(1_700_000_000n)
  })

  it('skips mints and burns', async () => {
    await onChain(HEMI, [
      leg('0xmint', 0, zeroAddress, RECEIVER),
      leg('0xburn', 1, SENDER, zeroAddress),
    ])

    expect(await ti.ShareTransfer.get('0xmint-0')).toBeUndefined()
    expect(await ti.ShareTransfer.get('0xburn-1')).toBeUndefined()
  })

  it('keeps Router in-transit legs (deduped downstream)', async () => {
    await onChain(HEMI, [leg('0xrouterleg', 2, ROUTER, RECEIVER)])

    const stored = await ti.ShareTransfer.getOrThrow('0xrouterleg-2')
    expect(stored.from).toBe(ROUTER.toLowerCase())
  })
})

describe('rate snapshots', () => {
  it('records a deposit rate point (staked/shares)', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_100 },
        contract: 'Agent',
        event: 'DepositRequestReceived',
        params: { asset: ASSET, assets: 1000n, requestId: 70n },
        transaction: { from: SENDER, hash: '0xrecv' },
      },
      {
        block: { number: ETH_START, timestamp: 1_700_000_200 },
        contract: 'Agent',
        event: 'DepositRequestProcessed',
        logIndex: 3,
        params: { assets: 1000n, requestId: 70n, shares: 12n, staked: 999n },
        transaction: { from: SENDER, hash: '0xproc' },
      },
    ])

    const rate = await ti.RateSnapshot.getOrThrow('0xproc-3')
    expect(rate.asset).toBe(ASSET.toLowerCase())
    expect(rate.rateNumerator).toBe(999n)
    expect(rate.rateDenominator).toBe(12n)
    expect(rate.timestamp).toBe(1_700_000_200n)
  })

  it('records a redeem rate point consuming unstaked', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_100 },
        contract: 'Agent',
        event: 'RedeemRequestReceived',
        params: { asset: ASSET, requestId: 71n, share: SHARE, shares: 500n },
        transaction: { from: SENDER, hash: '0xrrecv' },
      },
      {
        block: { number: ETH_START, timestamp: 1_700_000_200 },
        contract: 'Agent',
        event: 'RedeemRequestProcessed',
        logIndex: 4,
        params: { assets: 470n, requestId: 71n, shares: 500n, unstaked: 480n },
        transaction: { from: SENDER, hash: '0xrproc' },
      },
    ])

    const rate = await ti.RateSnapshot.getOrThrow('0xrproc-4')
    expect(rate.asset).toBe(ASSET.toLowerCase())
    expect(rate.rateNumerator).toBe(480n)
    expect(rate.rateDenominator).toBe(500n)
  })

  it('records no rate point when the asset is unknown', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_200 },
        contract: 'Agent',
        event: 'DepositRequestProcessed',
        logIndex: 5,
        params: { assets: 1000n, requestId: 72n, shares: 12n, staked: 999n },
        transaction: { from: SENDER, hash: '0xnoasset' },
      },
    ])

    expect(await ti.RateSnapshot.get('0xnoasset-5')).toBeUndefined()
  })

  it('appends a point per processing (a re-processed request keeps both)', async () => {
    await onChain(ETH, [
      {
        block: { number: ETH_START, timestamp: 1_700_000_100 },
        contract: 'Agent',
        event: 'DepositRequestReceived',
        params: { asset: ASSET, assets: 1000n, requestId: 73n },
        transaction: { from: SENDER, hash: '0xrecv2' },
      },
      {
        block: { number: ETH_START, timestamp: 1_700_000_200 },
        contract: 'Agent',
        event: 'DepositRequestProcessed',
        logIndex: 1,
        params: { assets: 1000n, requestId: 73n, shares: 10n, staked: 1000n },
        transaction: { from: SENDER, hash: '0xp1' },
      },
      {
        block: { number: ETH_START, timestamp: 1_700_000_300 },
        contract: 'Agent',
        event: 'DepositRequestProcessed',
        logIndex: 1,
        params: { assets: 1000n, requestId: 73n, shares: 10n, staked: 1010n },
        transaction: { from: SENDER, hash: '0xp2' },
      },
    ])

    const first = await ti.RateSnapshot.getOrThrow('0xp1-1')
    const second = await ti.RateSnapshot.getOrThrow('0xp2-1')
    expect(first.rateNumerator).toBe(1000n)
    expect(second.rateNumerator).toBe(1010n)
  })
})
