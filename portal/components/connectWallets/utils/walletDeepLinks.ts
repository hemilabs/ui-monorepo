const walletDeepLinks: Record<string, string> = {
  okx: 'okex://',
  phantom: 'phantom://',
  tokenPocket: 'tpoutside://',
}

export const getWalletDeepLink = (walletId: string) => walletDeepLinks[walletId]

export const hasDeepLinkSupport = (walletId: string) =>
  !!walletDeepLinks[walletId]
