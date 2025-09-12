import { hemi as hemiMainnet, hemiSepolia } from 'hemi-viem'
import { useHemi } from 'hooks/useHemi'
import { useTranslations } from 'next-intl'
import { Chain } from 'viem'

type Props = {
  claimGroupId: number
}

export const ClaimGroupName = function ({ claimGroupId }: Props) {
  const hemi = useHemi()
  const t = useTranslations('genesis-drop.claim-groups')

  const defaultText = t('genesis-drop')

  const claimGroupMap: Record<Chain['id'], Record<number, string>> = {
    [hemiMainnet.id]: {
      14: t('spectra-and-dodo'),
    },
    // These are just for testing
    [hemiSepolia.id]: {
      2: t('spectra-and-dodo'),
      3: t('other-drop'),
    },
  }

  const text = claimGroupMap[hemi.id]?.[claimGroupId] ?? defaultText
  return <>{text}</>
}
