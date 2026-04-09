'use client'

import { useOnClickOutside } from '@hemilabs/react-hooks/useOnClickOutside'
import { Chevron } from 'components/icons/chevron'
import { Menu } from 'components/menu'
import { TokenLogo } from 'components/tokenLogo'
import { TokenSelectorReadOnly } from 'components/tokenSelector/readonly'
import { useNetworkType } from 'hooks/useNetworkType'
import { useRouter } from 'i18n/navigation'
import { useState } from 'react'
import { queryStringObjectToString } from 'utils/url'

import { useEarnPools } from '../../../_hooks/useEarnPools'
import { type EarnPool } from '../../../types'

type Props = {
  disabled?: boolean
  pool: EarnPool
}

export const VaultTokenSelector = function ({ disabled, pool }: Props) {
  const router = useRouter()
  const { data: pools = [] } = useEarnPools()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [networkType] = useNetworkType()
  const dropdownRef = useOnClickOutside<HTMLDivElement>(() =>
    setIsDropdownOpen(false),
  )

  if (pools.length <= 1) {
    return <TokenSelectorReadOnly token={pool.token} />
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-x-1.5 rounded-lg bg-white px-3 py-1.5 shadow-sm"
        disabled={disabled}
        onClick={() => setIsDropdownOpen(prev => !prev)}
        type="button"
      >
        <TokenLogo size="small" token={pool.token} />
        <span className="text-sm font-semibold text-neutral-950">
          {pool.token.symbol}
        </span>
        <Chevron.Bottom className="[&>path]:fill-neutral-950" />
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 top-full z-20 mt-1">
          <Menu
            items={pools.map(p => ({
              content: (
                <button
                  className="-mx-2 -my-1 flex items-center gap-x-2 px-2 py-1 text-left text-sm"
                  onClick={function () {
                    setIsDropdownOpen(false)
                    router.push(
                      `/hemi-earn/vault/${
                        p.vaultAddress
                      }${queryStringObjectToString({ networkType })}`,
                    )
                  }}
                  type="button"
                >
                  <TokenLogo size="small" token={p.token} />
                  {p.token.symbol}
                </button>
              ),
              id: p.vaultAddress,
            }))}
          />
        </div>
      )}
    </div>
  )
}
