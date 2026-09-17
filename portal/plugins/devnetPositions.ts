import { type Address, type Chain, createPublicClient, http } from 'viem'
import { type Plugin } from 'vite'

/**
 * Serves the staking dashboard's positions from a veHEMI rewards scenario devnet.
 *
 * Dev server only (`apply: 'serve'`), and inert unless `VITE_VE_HEMI_EPOCH_REWARDS` names
 * a rewards contract. Nothing here reaches a production bundle.
 *
 * It exists because the dashboard's positions come from a subgraph indexing the real
 * veHEMI, while a scenario rewards contract binds to a mock veHEMI at a different address
 * on the same chain - disjoint token-id spaces. Pointing the Portal at a scenario devnet
 * would otherwise show the real chain's positions beside the mock's reward figures,
 * pairing one position's lock with another's money.
 *
 * Built from the mock's point history (`userPointEpoch` / `getUserPoint`), which records
 * the amount, instant and owner at every change - the same thing
 * `subgraphs/ve-hemi-subgraph` reconstructs from events. So the two agree on what
 * matters: a position is listed for every wallet that has held it, `pastOwners` is the
 * position's own history, a burned position keeps the amount it held, and `lockTime` is
 * a duration.
 *
 * Where it still differs from the real endpoint:
 *   - `transactionHash` is the zero hash. The mock records no transaction, and the
 *     Amount cell's explorer link is therefore dead on every row.
 *   - `blockNumber` is whatever the mock stored, which is 0.
 *   - A BURNED position's "On <date>" is the instant it was burned. The subgraph keeps
 *     the original unlock date there instead, which the mock discards at burn.
 *   - `forfeitable` and `transferable` come from the rewards contract's `positionClass`
 *     rather than from veHEMI. Nothing in the dashboard reads either field today.
 *   - Voting power is read from the REAL veHEMI in the browser for these token ids and
 *     cannot be intercepted here, so that card is meaningless in this mode.
 */

const mockVeHemiAbi = [
  {
    inputs: [{ type: 'uint256' }],
    name: 'burned',
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'getLockedBalance',
    outputs: [
      {
        components: [
          { name: 'amount', type: 'int128' },
          { name: 'end', type: 'uint64' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'epoch', type: 'uint256' },
    ],
    name: 'getUserPoint',
    outputs: [
      {
        components: [
          {
            components: [
              { name: 'bias', type: 'int128' },
              { name: 'slope', type: 'int128' },
              { name: 'timestamp', type: 'uint64' },
              { name: 'blockNumber', type: 'uint64' },
              { name: 'amount', type: 'uint128' },
              { name: 'fixedBias', type: 'uint256' },
            ],
            name: 'point',
            type: 'tuple',
          },
          { name: 'owner', type: 'address' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ type: 'uint256' }],
    name: 'mintedIds',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'mintedIdsLength',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'userPointEpoch',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const rewardsAbi = [
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'positionClass',
    outputs: [
      { name: 'transferableAfter', type: 'uint64' },
      { name: 'forfeitable', type: 'bool' },
      { name: 'captured', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'veHemi',
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const zeroHash = `0x${'0'.repeat(64)}`

type Position = {
  amount: bigint
  burnedAt: number | undefined
  createdAt: number
  end: number
  forfeitable: boolean
  owner: Address
  // Every wallet that has held it, oldest first, the current owner last.
  owners: Address[]
  tokenId: bigint
  transferable: boolean
}

/**
 * Every position the mock has minted, rebuilt from its point history.
 *
 * Read once for the whole devnet rather than per wallet: the dashboard issues this from
 * several hooks and refetches on focus, and a per-wallet rebuild put over a hundred
 * uncached `eth_call`s on a shared endpoint, which rate-limited.
 */
const loadWorld = async function (chain: Chain, rewardsAddress: Address) {
  const client = createPublicClient({
    chain,
    transport: http(undefined, { batch: true }),
  })
  const read = <T>(p: Promise<T>) => p

  const veHemi = await client.readContract({
    abi: rewardsAbi,
    address: rewardsAddress,
    functionName: 'veHemi',
  })

  const count = await client.readContract({
    abi: mockVeHemiAbi,
    address: veHemi,
    functionName: 'mintedIdsLength',
  })

  const tokenIds = await Promise.all(
    Array.from({ length: Number(count) }, (_unused, index) =>
      client.readContract({
        abi: mockVeHemiAbi,
        address: veHemi,
        args: [BigInt(index)],
        functionName: 'mintedIds',
      }),
    ),
  )

  return Promise.all(
    tokenIds.map(async function (tokenId): Promise<Position> {
      // No `.catch` in here on purpose: a swallowed read becomes a zero amount or a
      // dropped row, and either reads as fact. A rejection becomes a 502 instead.
      const [isBurned, pointCount, locked, positionClass] = await Promise.all([
        read(
          client.readContract({
            abi: mockVeHemiAbi,
            address: veHemi,
            args: [tokenId],
            functionName: 'burned',
          }),
        ),
        read(
          client.readContract({
            abi: mockVeHemiAbi,
            address: veHemi,
            args: [tokenId],
            functionName: 'userPointEpoch',
          }),
        ),
        read(
          client.readContract({
            abi: mockVeHemiAbi,
            address: veHemi,
            args: [tokenId],
            functionName: 'getLockedBalance',
          }),
        ),
        read(
          client.readContract({
            abi: rewardsAbi,
            address: rewardsAddress,
            args: [tokenId],
            functionName: 'positionClass',
          }),
        ),
      ])

      const points = await Promise.all(
        Array.from({ length: Number(pointCount) }, (_unused, index) =>
          client.readContract({
            abi: mockVeHemiAbi,
            address: veHemi,
            args: [tokenId, BigInt(index + 1)],
            functionName: 'getUserPoint',
          }),
        ),
      )

      const owners: Address[] = []
      points.forEach(function ({ owner }) {
        if (owner !== undefined && owners.at(-1) !== owner) {
          owners.push(owner)
        }
      })

      // The burn zeroes the live lock, so take the amount from the last point that had
      // one. For a position that never burned that is the latest point.
      const withAmount = points.filter(({ point }) => point.amount > BigInt(0))
      const now = Math.floor(Date.now() / 1000)

      return {
        amount: withAmount.at(-1)?.point.amount ?? BigInt(0),
        burnedAt: isBurned
          ? Number(points.at(-1)?.point.timestamp ?? 0)
          : undefined,
        createdAt: Number(points[0]?.point.timestamp ?? 0),
        end: Number(locked.end),
        forfeitable: positionClass[1],
        owner: owners.at(-1) ?? `0x${'0'.repeat(40)}`,
        owners,
        tokenId,
        transferable: Number(positionClass[0]) <= now,
      }
    }),
  )
}

// Long enough to collapse the dashboard's burst of identical requests, short enough that
// a claim, transfer or burn shows up on the next refetch rather than after a restart.
const worldTtlMs = 5_000
let cached: { at: number; world: Promise<Position[]> } | undefined

const getWorld = function (chain: Chain, rewardsAddress: Address) {
  if (cached === undefined || Date.now() - cached.at > worldTtlMs) {
    const world = loadWorld(chain, rewardsAddress)
    cached = { at: Date.now(), world }
    // Don't remember a failed build, or one blip poisons every later request.
    const forget = function () {
      cached = undefined
    }
    world.catch(forget)
  }
  return cached.world
}

const toApiPosition = function (position: Position) {
  const {
    amount,
    burnedAt,
    createdAt,
    end,
    forfeitable,
    owner,
    owners,
    tokenId,
    transferable,
  } = position
  // The subgraph stores a duration and the dashboard derives the unlock instant as
  // `timestamp + lockTime`. Reporting time remaining instead turned the Lockup column
  // into a countdown that shrank on every refetch.
  const finishedAt = burnedAt ?? end

  return {
    amount: amount.toString(),
    // Not recorded by the mock.
    blockNumber: '0',
    blockTimestamp: createdAt.toString(),
    forfeitable,
    id: tokenId.toString(),
    lockTime: Math.max(0, finishedAt - createdAt).toString(),
    owner,
    pastOwners: owners.slice(0, -1),
    status: burnedAt === undefined ? 'active' : 'withdrawn',
    timestamp: createdAt.toString(),
    tokenId: tokenId.toString(),
    transactionHash: zeroHash,
    transferable,
  }
}

export const devnetPositions = function (env: Record<string, string>): Plugin {
  const rewardsAddress = env.VITE_VE_HEMI_EPOCH_REWARDS as Address | undefined

  return {
    apply: 'serve',
    configureServer(server) {
      if (!rewardsAddress) {
        return
      }
      // Registered directly rather than as a post hook, so it runs before the
      // `/portal-api` proxy and can answer instead of forwarding.
      server.middlewares.use(async function (req, res, next) {
        const match =
          /^\/portal-api\/subgraphs\/(\d+)\/locks\/(0x[0-9a-fA-F]{40})(?:[/?]|$)/.exec(
            req.url ?? '',
          )
        if (!match) {
          next()
          return
        }
        const [, chainId, address] = match
        const holder = address.toLowerCase()
        try {
          const { hemiSepolia } = await import('hemi-viem')
          if (Number(chainId) !== hemiSepolia.id) {
            next()
            return
          }
          const world = await getWorld(hemiSepolia, rewardsAddress)
          const positions = world
            // Listed for every wallet that has held it, like the subgraph's
            // `owner`/`pastOwners` match. A wallet that sold a position still needs to
            // see it, and it must not vanish once the rewards are claimed.
            .filter(position =>
              position.owners.some(owner => owner.toLowerCase() === holder),
            )
            // Newest lock first, as the real endpoint orders them.
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(toApiPosition)

          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ positions }))
        } catch (error) {
          server.config.logger.error(
            `[devnet-positions] ${(error as Error).message}`,
          )
          // A failure, not an empty list, so the dashboard can say it couldn't read.
          res.statusCode = 502
          res.end(JSON.stringify({ error: 'devnet positions unavailable' }))
        }
      })
    },
    name: 'devnet-positions',
  }
}
