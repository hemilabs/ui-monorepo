'use client'

import { Button, ButtonIcon } from 'components/button'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { useRouter } from 'i18n/navigation'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { type EarnPool } from '../../../types'

type Props = {
  pool: EarnPool
}

export const VaultNavigation = function ({ pool }: Props) {
  const router = useRouter()
  const t = useTranslations('hemi-earn')
  const { data: pools = [] } = useEarnPools()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div className="flex items-center gap-x-1">
      <div className="group">
        <ButtonIcon
          aria-label={t('navigation.back')}
          onClick={() => router.back()}
          size="xSmall"
          type="button"
          variant="tertiary"
        >
          <Chevron.Left className="[&>path]:fill-neutral-500 [&>path]:transition-colors [&>path]:duration-300 group-hover:[&>path]:fill-neutral-950" />
        </ButtonIcon>
      </div>
      <Button
        onClick={() => router.push('/hemi-earn')}
        size="xSmall"
        type="button"
        variant="tertiary"
      >
        {t('navigation.hemi-earn')}
      </Button>
      <span className="text-xs font-semibold text-neutral-950">/</span>
      <div className="relative">
        <Button
          onClick={() => setIsDropdownOpen(prev => !prev)}
          size="xSmall"
          type="button"
          variant="tertiary"
        >
          {t('navigation.vault-name', { tokenSymbol: pool.token.symbol })}
          <Chevron.Bottom className="[&>path]:fill-neutral-950" />
        </Button>
        {isDropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />
            <div className="absolute left-0 top-full z-20 mt-1">
              <Menu
                items={pools.map(p => ({
                  content: (
                    <button
                      className="w-full text-left text-sm"
                      onClick={function () {
                        setIsDropdownOpen(false)
                        router.push(`/hemi-earn/vault/${p.vaultAddress}`)
                      }}
                      type="button"
                    >
                      {t('navigation.vault-name', {
                        tokenSymbol: p.token.symbol,
                      })}
                    </button>
                  ),
                  id: p.vaultAddress,
                }))}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
