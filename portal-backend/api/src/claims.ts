import fs from 'fs/promises'
import path from 'path'
import { type Hex, type Address } from 'viem'

type ClaimData = {
  amount: string
  claimGroupId?: number
  proof?: Hex[]
}

type Distribution = { [address: Address]: ClaimData }
type ChainDistributions = { [claimGroupId: number]: Distribution }
type LocalData = { [chainId: string]: ChainDistributions }

const dataDir = path.join(import.meta.dirname, 'claims-data')

async function loadLocalData(): Promise<LocalData> {
  const localData: LocalData = {}
  const files = await fs.readdir(dataDir)
  await Promise.all(
    files.map(async function (file) {
      const match = file.match(/^(\d+)-(\d+)\.json$/)
      if (!match) {
        return
      }
      const chainId = match[1]
      const claimGroupId = Number(match[2])
      const filePath = path.join(dataDir, file)
      const distribution = JSON.parse(await fs.readFile(filePath, 'utf8'))
      if (!localData[chainId]) {
        localData[chainId] = {}
      }
      localData[chainId][claimGroupId] = distribution
    }),
  )
  return localData
}

// Kick off the read + parse once at module load. Every call to createClaims
// awaits the same promise, so the work happens only once.
const localDataPromise = loadLocalData()

function createClaims() {
  async function getAllUserClaimData(
    chainId: string,
    address: Address,
  ): Promise<ClaimData[]> {
    const localData = await localDataPromise
    return Object.entries(localData[chainId] || {}).map(function ([
      claimGroupId,
      claimGroup,
    ]) {
      const data = claimGroup[address]
      return data
        ? data
        : {
            amount: '0',
            claimGroupId: Number(claimGroupId),
            proof: [],
          }
    })
  }

  return {
    getAllUserClaimData,
  }
}

export { createClaims }
