'use client'

import { useDebounce } from '@hemilabs/react-hooks/useDebounce'
import { ColumnDef } from '@tanstack/react-table'
import { Card } from 'components/card'
import { SearchInput } from 'components/inputText'
import { Table } from 'components/table'
import { Header } from 'components/table/_components/header'
import { useHemi } from 'hooks/useHemi'
import { useHemiTokens } from 'hooks/useHemiTokens'
import { useNetworks } from 'hooks/useNetworks'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { RemoteChain } from 'types/chain'
import { EvmToken } from 'types/token'
import { isAddress, isAddressEqual } from 'viem'
import { type Chain } from 'viem'

import { NoMatchingTokens } from './noMatchingTokens'
import { Section } from './section'
import {
  TokenTableAddressCell,
  TokenTableL1AddressCell,
} from './tokenTable/addressCell'
import { AddTokenTableButton } from './tokenTable/addTokenButton'
import { GetStartedTableColumn } from './tokenTable/column'
import { TokenTableTokenCell } from './tokenTable/tokenCell'

type TokenTableColumnsProps = {
  hemi: Chain
  remoteNetworks: RemoteChain[]
  t: ReturnType<typeof useTranslations<'get-started'>>
}

const tokenTableColumns = ({
  hemi,
  remoteNetworks,
  t,
}: TokenTableColumnsProps): ColumnDef<EvmToken>[] => [
  {
    cell: ({ row }) => <TokenTableTokenCell token={row.original} />,
    header: () => <Header text={t('token')} />,
    id: 'token',
    meta: { width: 200 },
  },
  {
    cell: ({ row }) => (
      <TokenTableL1AddressCell
        remoteNetworks={remoteNetworks}
        token={row.original}
      />
    ),
    header: () => <Header text={t('l1-address')} />,
    id: 'l1-address',
    meta: { width: 147 },
  },
  {
    cell: ({ row }) => (
      <TokenTableAddressCell
        address={row.original.address}
        networkName={hemi.name}
      />
    ),
    header: () => <Header text={t('l2-address')} />,
    id: 'l2-address',
    meta: { width: 385 },
  },
  {
    cell: ({ row }) => (
      <div className="flex w-full justify-end">
        <AddTokenTableButton token={row.original} />
      </div>
    ),
    header: () => <Header text={t('action')} />,
    id: 'action',
    meta: { className: 'justify-end', width: 116 },
  },
]

const filterTokensBySearch = function (tokens: EvmToken[], searchText: string) {
  const trimmed = searchText.trim()
  const query = trimmed.toLowerCase()
  const userTypedAddress = isAddress(trimmed)

  return query
    ? tokens.filter(
        token =>
          token.name.toLowerCase().includes(query) ||
          token.symbol.toLowerCase().includes(query) ||
          (userTypedAddress &&
            isAddress(token.address) &&
            isAddressEqual(token.address, trimmed)),
      )
    : tokens
}

export const AddHemiToken = function () {
  const t = useTranslations('get-started')
  const hemi = useHemi()
  const { remoteNetworks } = useNetworks()
  const hemiTokens = useHemiTokens()
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText)

  const columns = useMemo(
    () => tokenTableColumns({ hemi, remoteNetworks, t }),
    [hemi, remoteNetworks, t],
  )

  const tokens = useMemo(
    () => filterTokensBySearch(hemiTokens, debouncedSearchText),
    [debouncedSearchText, hemiTokens],
  )

  const showNoMatchingTokens =
    debouncedSearchText.trim().length > 0 && tokens.length === 0

  return (
    <Section card={false} step={{ position: 2 }}>
      <Card>
        <div className="p-4 font-medium lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[332px]">
              <h3 className="text-mid-md font-semibold text-neutral-950">
                {t('add-hemi-tokens')}
              </h3>
              <p className="mt-1 font-normal text-neutral-500">
                {t('add-hemi-tokens-description')}
              </p>
            </div>
            <div className="w-full shrink-0 lg:w-60">
              <SearchInput
                name="search-hemi-tokens"
                onChange={e => setSearchText(e.target.value)}
                onClear={() => setSearchText('')}
                placeholder={t('search-tokens-placeholder')}
                size="xs"
                value={searchText}
              />
            </div>
          </div>
          <div className="mt-6 w-full rounded-xl text-sm font-medium">
            <div className="h-72 overflow-hidden">
              <Table
                cellComponent={GetStartedTableColumn}
                columns={columns}
                data={tokens}
                placeholder={
                  showNoMatchingTokens ? <NoMatchingTokens /> : undefined
                }
                priorityColumnIdsOnSmall={['action', 'token']}
                rowSize={64}
              />
            </div>
          </div>
        </div>
      </Card>
    </Section>
  )
}
