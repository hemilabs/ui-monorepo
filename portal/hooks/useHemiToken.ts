import { hemi, hemiSepolia } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { tokenList } from 'tokenList'
import { EvmToken } from 'types/token'
import { Address, Chain } from 'viem'

const hemiTokenMap: Record<Chain['id'], Address> = {
  [hemi.id]: '0x99e3dE3817F6081B2568208337ef83295b7f591D',
  [hemiSepolia.id]: '0xbaacf81C8341c3Cb983BC48051Cc7377d2A2Eb93',
}
export const useHemiToken = function () {
  const hemiTokenAddress = hemiTokenMap[useHemi().id]
  return tokenList.tokens.find(t => t.address === hemiTokenAddress) as EvmToken
}
