'use client'

import { useQuery } from '@tanstack/react-query'

import { hemiEarnSharesQueryOptions } from '../_fetchers/fetchHemiEarnShares'

export const useHemiEarnShares = () => useQuery(hemiEarnSharesQueryOptions())
