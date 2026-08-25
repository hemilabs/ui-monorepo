import { type EvmWalletData } from 'hooks/useAllWallets'
import { isMobile, isAndroid, isIOS } from 'react-device-detect'

function getMobileDownloadUrl(downloadUrls: EvmWalletData['downloadUrls']) {
  if (!downloadUrls) {
    return undefined
  }
  if (isIOS && downloadUrls.ios) {
    return downloadUrls.ios
  }
  if (isAndroid && downloadUrls.android) {
    return downloadUrls.android
  }

  return downloadUrls.mobile || downloadUrls.browserExtension
}

function getDesktopDownloadUrl(downloadUrls: EvmWalletData['downloadUrls']) {
  if (!downloadUrls) {
    return undefined
  }

  return (
    downloadUrls.browserExtension || downloadUrls.chrome || downloadUrls.firefox
  )
}

export const getWalletDownloadUrl = function (wallet: EvmWalletData) {
  const { downloadUrls } = wallet

  if (!downloadUrls) {
    // If there is no download URL provided by the connector,
    // the only option left is the generic walletConnect
    const devices = isMobile ? 'Mobile' : 'Desktop,Web,Browser Extension'

    return `https://walletguide.walletconnect.network/?devices=${encodeURIComponent(
      devices,
    )}`
  }

  return isMobile
    ? getMobileDownloadUrl(downloadUrls)
    : getDesktopDownloadUrl(downloadUrls)
}
