export type ReqData = {
  data: Partial<{
    chainId: number
    fromBlock: number
    limit: number
    orderBy: string
    skip: number
    orderDirection: 'asc' | 'desc'
  }>
}

export type ChainIdPathParams = { chainIdStr: string }
