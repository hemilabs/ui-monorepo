import { type EvmWalletData } from 'hooks/useAllWallets'
import {
  isAndroid,
  isChrome,
  isFirefox,
  isIOS,
  isMobile,
} from 'react-device-detect'

const getMobileDownloadUrl = (
  downloadUrls: NonNullable<EvmWalletData['downloadUrls']>,
) =>
  (isIOS && downloadUrls.ios) ||
  (isAndroid && downloadUrls.android) ||
  downloadUrls.mobile

const getDesktopDownloadUrl = (
  downloadUrls: NonNullable<EvmWalletData['downloadUrls']>,
) =>
  (isChrome && downloadUrls.chrome) ||
  (isFirefox && downloadUrls.firefox) ||
  downloadUrls.browserExtension

export const getWalletDownloadUrl = function (wallet: EvmWalletData) {
  const { downloadUrls } = wallet

  if (!downloadUrls) {
    return undefined
  }

  return isMobile
    ? getMobileDownloadUrl(downloadUrls)
    : getDesktopDownloadUrl(downloadUrls)
}
