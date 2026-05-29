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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      // Populated by the subgraph route middlewares (parseChainId,
      // parseQueryParams) before the route handlers read it.
      data: ReqData['data']
    }
  }
}
